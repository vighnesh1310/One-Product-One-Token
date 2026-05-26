// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    enum Role { Manufacturer, Distributor, Retailer, Customer }

    struct Product {
        uint256 tokenId;
        string productName;
        string batchNumber;
        string manufacturerName;
        string manufacturerLocation;
        uint256 harvestDate;
        address currentOwner;
        bool isAuthentic;
        bool exists;
        uint256 price;
        bool isForSale;
    }

    struct TransferRecord {
        address from;
        address to;
        string location;
        string notes;
        uint256 timestamp;
        Role transferredByRole;
    }

    uint256 private _tokenCounter;
    mapping(uint256 => Product) public products;
    mapping(uint256 => TransferRecord[]) public transferHistory;
    mapping(address => Role) public participantRoles;
    mapping(address => bool) public registeredParticipants;
    address public admin;

    bool private locked;

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    event ProductCreated(uint256 indexed tokenId, string productName, address indexed manufacturer);
    event OwnershipTransferred(uint256 indexed tokenId, address indexed from, address indexed to, string location);
    event ProductVerified(uint256 indexed tokenId, bool isAuthentic);

    modifier onlyAdmin() { require(msg.sender == admin, "Only admin"); _; }
    modifier productExists(uint256 tokenId) { require(products[tokenId].exists, "Product does not exist"); _; }

    constructor() {
        admin = msg.sender;
        registeredParticipants[msg.sender] = true;
        participantRoles[msg.sender] = Role.Manufacturer;
    }

    function registerParticipant(address participant, Role role) external onlyAdmin {
        registeredParticipants[participant] = true;
        participantRoles[participant] = role;
    }

    function selfRegister(Role role) external {
        registeredParticipants[msg.sender] = true;
        participantRoles[msg.sender] = role;
    }

    function createProductToken(
        string memory productName,
        string memory batchNumber,
        string memory manufacturerName,
        string memory manufacturerLocation,
        uint256 harvestDate
    ) external returns (uint256) {
        if (!registeredParticipants[msg.sender]) {
            registeredParticipants[msg.sender] = true;
            participantRoles[msg.sender] = Role.Manufacturer;
        }
        _tokenCounter++;
        uint256 newTokenId = _tokenCounter;
        products[newTokenId] = Product({
            tokenId: newTokenId,
            productName: productName,
            batchNumber: batchNumber,
            manufacturerName: manufacturerName,
            manufacturerLocation: manufacturerLocation,
            harvestDate: harvestDate,
            currentOwner: msg.sender,
            isAuthentic: true,
            exists: true,
            price: 0,
            isForSale: false
        });
        transferHistory[newTokenId].push(TransferRecord({
            from: address(0),
            to: msg.sender,
            location: manufacturerLocation,
            notes: "Product created and tokenized",
            timestamp: block.timestamp,
            transferredByRole: Role.Manufacturer
        }));
        emit ProductCreated(newTokenId, productName, msg.sender);
        return newTokenId;
    }

    function transferOwnership(
        uint256 tokenId,
        address newOwner,
        Role newOwnerRole,
        string memory location,
        string memory notes
    ) external productExists(tokenId) {
        require(products[tokenId].currentOwner == msg.sender, "Not the product owner");
        require(newOwner != address(0), "Invalid recipient");
        require(newOwner != msg.sender, "Cannot transfer to yourself");

        Role senderRole = participantRoles[msg.sender];
        
        // Strict Role Enforcement: Can only transfer downstream (Manufacturer [0] -> Distributor [1] -> Retailer [2] -> Customer [3])
        require(uint(newOwnerRole) > uint(senderRole), "Invalid role transition: Must move downstream in supply chain");

        // Auto-register or verify recipient
        if (!registeredParticipants[newOwner]) {
            registeredParticipants[newOwner] = true;
            participantRoles[newOwner] = newOwnerRole;
        } else {
            require(participantRoles[newOwner] == newOwnerRole, "Recipient is already registered with a different role");
        }

        address prev = msg.sender;
        products[tokenId].currentOwner = newOwner;

        transferHistory[tokenId].push(TransferRecord({
            from: prev,
            to: newOwner,
            location: location,
            notes: notes,
            timestamp: block.timestamp,
            transferredByRole: senderRole
        }));
        emit OwnershipTransferred(tokenId, prev, newOwner, location);
    }

    function getProductHistory(uint256 tokenId) external view productExists(tokenId) returns (TransferRecord[] memory) {
        return transferHistory[tokenId];
    }

    function verifyAuthenticity(uint256 tokenId) external view productExists(tokenId) returns (bool, Product memory) {
        return (products[tokenId].isAuthentic, products[tokenId]);
    }

    function getProduct(uint256 tokenId) external view productExists(tokenId) returns (Product memory) {
        return products[tokenId];
    }

    function getTotalProducts() external view returns (uint256) { return _tokenCounter; }

    function flagProduct(uint256 tokenId) external onlyAdmin productExists(tokenId) {
        products[tokenId].isAuthentic = false;
        emit ProductVerified(tokenId, false);
    }

    function restoreProduct(uint256 tokenId) external onlyAdmin productExists(tokenId) {
        products[tokenId].isAuthentic = true;
        emit ProductVerified(tokenId, true);
    }

    // --- Marketplace Functions ---

    function listForSale(uint256 tokenId, uint256 price) external productExists(tokenId) {
        require(products[tokenId].currentOwner == msg.sender, "Not the product owner");
        require(price > 0, "Price must be greater than zero");

        products[tokenId].price = price;
        products[tokenId].isForSale = true;
    }

    function buyProduct(uint256 tokenId) external payable productExists(tokenId) nonReentrant {
        Product storage p = products[tokenId];
        require(p.isForSale, "Product not for sale");
        require(msg.value == p.price, "Incorrect ETH amount sent");
        require(msg.sender != p.currentOwner, "Cannot buy your own product");

        address prevOwner = p.currentOwner;
        Role prevRole = participantRoles[prevOwner];

        // 1. Effects: Update ownership state first (Checks-Effects-Interactions)
        p.currentOwner = msg.sender;
        p.isForSale = false;
        p.price = 0;

        if (!registeredParticipants[msg.sender]) {
            registeredParticipants[msg.sender] = true;
            participantRoles[msg.sender] = Role.Customer;
        }

        transferHistory[tokenId].push(TransferRecord({
            from: prevOwner,
            to: msg.sender,
            location: "Marketplace Purchase",
            notes: "Purchased via Smart Contract",
            timestamp: block.timestamp,
            transferredByRole: prevRole
        }));

        emit OwnershipTransferred(tokenId, prevOwner, msg.sender, "Marketplace Purchase");

        // 2. Interactions: Transfer funds last
        (bool success, ) = payable(prevOwner).call{value: msg.value}("");
        require(success, "ETH transfer failed");
    }
}
