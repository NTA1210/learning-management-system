import TimeSlotModel from "../models/timeSlot.model";
import mongoose from "mongoose";
import {MONGO_URI} from "@/constants/env";

/**
 * Script to initialize default time slots for the LMS system
 * Run this once after deploying the new schedule feature
 */

const defaultTimeSlots = [
    {
        slotNumber: 1,
        slotName: "Slot 1 - Early Morning",
        startTime: "07:00",
        endTime: "09:00",
        duration: 120,
        isActive: true,
        order: 1,
    },
    {
        slotNumber: 2,
        slotName: "Slot 2 - Late Morning",
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        isActive: true,
        order: 2,
    },
    {
        slotNumber: 3,
        slotName: "Slot 3 - Midday",
        startTime: "11:00",
        endTime: "13:00",
        duration: 120,
        isActive: true,
        order: 3,
    },
    {
        slotNumber: 4,
        slotName: "Slot 4 - Early Afternoon",
        startTime: "13:00",
        endTime: "15:00",
        duration: 120,
        isActive: true,
        order: 4,
    },
    {
        slotNumber: 5,
        slotName: "Slot 5 - Late Afternoon",
        startTime: "15:00",
        endTime: "17:00",
        duration: 120,
        isActive: true,
        order: 5,
    },
    {
        slotNumber: 6,
        slotName: "Slot 6 - Evening",
        startTime: "17:00",
        endTime: "19:00",
        duration: 120,
        isActive: true,
        order: 6,
    },
];

async function seedTimeSlots() {
    try {
        await mongoose.connect("mongodb+srv://minhhieu69420:fVCAoajSIt8Tg8XG@cluster0.rpp2msz.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0");
        console.log("MongoDB connected");

        // Check if slots already exist
        const existingSlots = await TimeSlotModel.countDocuments();
        if (existingSlots > 0) {
            console.log(`Found ${existingSlots} existing time slots`);
            console.log("Skipping seed - time slots already initialized");
            process.exit(0);
        }

        // Insert default time slots
        console.log("Creating default time slots...");
        const result = await TimeSlotModel.insertMany(defaultTimeSlots);
        console.log(`✅ Successfully created ${result.length} time slots`);

        // Display created slots
        result.forEach((slot) => {
            console.log(
                `  ${slot.slotName}: ${slot.startTime} - ${slot.endTime} (${slot.duration} min)`
            );
        });

        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error seeding time slots:", error);
        process.exit(1);
    }
}

// Run the seed script
seedTimeSlots();

