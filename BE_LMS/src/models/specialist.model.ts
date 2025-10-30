import ISpecialist from "@/types/specialist.type";
import mongoose from "mongoose";

const SpecialistSchema = new mongoose.Schema<ISpecialist>(
  {
    name: { type: String, required: true },
    description: { type: String },
    slug: { type: String },
    majorId: { type: mongoose.Schema.Types.ObjectId, ref: "Major" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

//indexes
SpecialistSchema.index({ name: 1 }, { unique: true });
SpecialistSchema.index({ name: "text" });
SpecialistSchema.index({ slug: 1 }, { unique: true });
SpecialistSchema.index({ slug: "text" });
SpecialistSchema.index({ majorIds: 1, isActive: 1 });

//hooks
SpecialistSchema.pre("save", function (next) {
  this.slug = this.name.toLowerCase().replace(/ /g, "-");
  next();
});

const SpecialistModel = mongoose.model<ISpecialist>(
  "Specialist",
  SpecialistSchema,
  "specialists"
);

export default SpecialistModel;
