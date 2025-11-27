import mongoose from 'mongoose';
import {IForum} from '../types';
import {ForumType} from '@/types/forum.type';

const ForumSchema = new mongoose.Schema<IForum>(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        title: {type: String, required: true, trim: true},
        description: {type: String, trim: true},
        forumType: {type: String, enum: ForumType, default: ForumType.DISCUSSION},
        key: [{type: String}],
        isActive: {type: Boolean, default: true},
        isArchived: {type: Boolean, default: false},
        createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    },
    {timestamps: true}
);

//Indexes
ForumSchema.index({courseId: 1, createdAt: -1});
ForumSchema.index({title: 'text', description: 'text'});

const ForumModel = mongoose.model<IForum>('Forum', ForumSchema, 'forums');

export default ForumModel;
