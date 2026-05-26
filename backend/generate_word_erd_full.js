const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = require("docx");

const imagePath = "C:\\Users\\vighnesh laxman kada\\.gemini\\antigravity\\brain\\d6a21c2c-df27-4015-9d76-82947cb9407e\\supply_chain_chen_erd_full_attributes_1778062475968.png";
const outputPath = "e:\\supply-chain\\OneToken_SupplyChain_ERD_Full.docx";

async function generate() {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "OneToken Supply Chain - Full Entity Relationship Diagram",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "\nThis document provides a comprehensive Chen notation ERD including all attributes extracted from the backend database models.",
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: fs.readFileSync(imagePath),
                                transformation: {
                                    width: 600,
                                    height: 450,
                                },
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: "Detailed Entity & Attribute Breakdown",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    
                    new Paragraph({ children: [new TextRun({ text: "1. User Entity: ", bold: true }), new TextRun("name, email, password, role, walletAddress, createdAt")] }),
                    
                    new Paragraph({ children: [new TextRun({ text: "2. Product Entity: ", bold: true }), new TextRun("tokenId, productName, batchNumber, manufacturerName, manufacturerLocation, harvestDate, currentOwner, isAuthentic, riskScore, riskFlags, qrCode, isForSale, priceWei, createdAt, updatedAt")] }),
                    
                    new Paragraph({ children: [new TextRun({ text: "3. Order Entity: ", bold: true }), new TextRun("tokenId, seller, buyer, priceWei, status, txHash, createdAt, completedAt")] }),
                    
                    new Paragraph({ children: [new TextRun({ text: "4. Payment Entity: ", bold: true }), new TextRun("orderId, payerAddress, payeeAddress, amountWei, currency, txHash, timestamp")] }),
                    
                    new Paragraph({ children: [new TextRun({ text: "5. TransferActivity Entity: ", bold: true }), new TextRun("tokenId, from, to, location, notes, timestamp, role, txHash, createdAt")] }),

                    new Paragraph({
                        text: "\nRelationships",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({ text: "- User 'owns' Product (1:N)" }),
                    new Paragraph({ text: "- User 'buys/sells' Order (1:N)" }),
                    new Paragraph({ text: "- Product 'tracked by' TransferActivity (1:N)" }),
                    new Paragraph({ text: "- Order 'results in' Payment (1:1)" }),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log("Full Word document generated successfully at: " + outputPath);
}

generate().catch(err => console.error(err));
