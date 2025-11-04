import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST() {
  try {
    const { db } = await connectToDatabase();

    // Get all samples from the database
    const samples = await db.collection("samples").find({}).toArray();

    // Extract all unique sample types
    const allSampleTypes = samples
      .map((sample) => sample.sampleType)
      .filter(Boolean);
    const uniqueSampleTypes = [...new Set(allSampleTypes)];

    // Define predefined types
    const predefinedTypes = [
      "Lavado brocoaveolar",
      "Blood Serum",
      "Plasma",
      "DNA",
      "RNA",
      "Tissue",
      "Urine",
      "Saliva",
    ];

    // Find custom types (not in predefined list)
    const customTypes = uniqueSampleTypes.filter(
      (type) => !predefinedTypes.includes(type)
    );

    console.log("Found custom types:", customTypes);

    // Update the settings with the rebuilt custom types
    await db.collection("settings").updateOne(
      { type: "customSampleTypes" },
      {
        $set: {
          type: "customSampleTypes",
          values: customTypes,
          updatedAt: new Date(),
          rebuiltAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Custom sample types rebuilt successfully",
      customSampleTypes: customTypes,
      totalSamplesAnalyzed: samples.length,
      customTypesFound: customTypes.length,
    });
  } catch (error) {
    console.error("Error rebuilding custom sample types:", error);
    return NextResponse.json(
      { error: "Failed to rebuild custom sample types" },
      { status: 500 }
    );
  }
}
