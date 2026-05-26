const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = require("docx");

const imagePath = "C:\\Users\\vighnesh laxman kada\\.gemini\\antigravity\\brain\\d6a21c2c-df27-4015-9d76-82947cb9407e\\supply_chain_chen_erd_1778062223302.png";
const outputPath = "e:\\supply-chain\\OneToken_SupplyChain_ERD.docx";

async function generate() {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "OneToken Supply Chain - ER Diagram (Chen Notation)",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "\nThis document provides a classic Chen notation ERD representation for the OneToken Supply Chain platform.",
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
                        text: "Notation Legend",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: "- Rectangles: Entities (User, Product, Order, etc.)",
                    }),
                    new Paragraph({
                        text: "- Ovals: Attributes (Name, Email, Price, etc.)",
                    }),
                    new Paragraph({
                        text: "- Diamonds: Relationships (Owns, Buys, Tracks, etc.)",
                    }),
                    new Paragraph({
                        text: "- Underlined Attributes: Primary Keys",
                    }),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log("Word document updated successfully at: " + outputPath);
}

generate().catch(err => console.error(err));
