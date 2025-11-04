import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get custom sample types from settings collection
    const settings = await db
      .collection("settings")
      .findOne({ type: "customSampleTypes" });

    const customSampleTypes = settings?.values || [];

    return NextResponse.json(customSampleTypes);
  } catch (error) {
    console.error("Error fetching custom sample types:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom sample types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customSampleType } = await request.json();

    if (!customSampleType || typeof customSampleType !== "string") {
      return NextResponse.json(
        { error: "Custom sample type is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get existing custom sample types
    const existingSettings = await db
      .collection("settings")
      .findOne({ type: "customSampleTypes" });
    const currentTypes = existingSettings?.values || [];

    // Check if the type already exists (case-insensitive)
    const typeExists = currentTypes.some(
      (type: string) => type.toLowerCase() === customSampleType.toLowerCase()
    );

    if (typeExists) {
      return NextResponse.json(
        { error: "Custom sample type already exists" },
        { status: 409 }
      );
    }

    // Add the new custom sample type
    const updatedTypes = [...currentTypes, customSampleType.trim()];

    // Upsert the settings document
    await db.collection("settings").updateOne(
      { type: "customSampleTypes" },
      {
        $set: {
          type: "customSampleTypes",
          values: updatedTypes,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Custom sample type added successfully",
      customSampleTypes: updatedTypes,
    });
  } catch (error) {
    console.error("Error adding custom sample type:", error);
    return NextResponse.json(
      { error: "Failed to add custom sample type" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { customSampleType } = await request.json();

    if (!customSampleType || typeof customSampleType !== "string") {
      return NextResponse.json(
        { error: "Custom sample type is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get existing custom sample types
    const existingSettings = await db
      .collection("settings")
      .findOne({ type: "customSampleTypes" });
    const currentTypes = existingSettings?.values || [];

    // Remove the custom sample type
    const updatedTypes = currentTypes.filter(
      (type: string) => type.toLowerCase() !== customSampleType.toLowerCase()
    );

    // Update the settings document
    await db.collection("settings").updateOne(
      { type: "customSampleTypes" },
      {
        $set: {
          values: updatedTypes,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Custom sample type removed successfully",
      customSampleTypes: updatedTypes,
    });
  } catch (error) {
    console.error("Error removing custom sample type:", error);
    return NextResponse.json(
      { error: "Failed to remove custom sample type" },
      { status: 500 }
    );
  }
}
