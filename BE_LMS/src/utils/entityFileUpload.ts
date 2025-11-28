import mongoose from "mongoose";
import {uploadFile, uploadFiles} from "./uploadFile";

/**
 * Generic helper for handling file uploads with entity creation.
 *
 * This solves the circular dependency problem where we need entity ID to create file prefix, but ID is only available after entity creation.
 *
 * Pattern: Create entity → Upload files → Update entity
 *
 * @example
 * ```ts
 * const forum = await createEntityWithFiles({
 *   createEntity: async () => ForumModel.create(data),
 *   files: req.files,
 *   getPrefixFn: (entityId) => prefixForumFile(courseId, entityId),
 *   updateEntity: async (entity, fileKeys) => {
 *     entity.key = fileKeys;
 *     await entity.save();
 *   },
 * });
 * ```
 */
export interface CreateEntityWithFilesOptions<T extends mongoose.Document> {
    /**
     * Function that creates the entity and returns it.
     * This will be called first to get the entity ID.
     */
    createEntity: () => Promise<T>;

    /**
     * Files to upload (single file or array of files).
     * If undefined/null, no upload will happen.
     */
    files?: Express.Multer.File | Express.Multer.File[];

    /**
     * Function that generates the file prefix using the entity ID.
     * @param entityId - The ID of the created entity.
     * @returns The prefix string for file storage.
     */
    getPrefixFn: (entityId: string) => string;

    /**
     * Function that updates the entity with the uploaded file keys.
     * @param entity - The created entity.
     * @param fileKeys - Array of uploaded file keys.
     */
    updateEntity: (entity: T, fileKeys: string[]) => Promise<void>;

    /**
     * Optional: Function to rollback entity creation if file upload fails.
     * If not provided, entity will remain even if upload fails.
     */
    rollbackEntity?: (entity: T) => Promise<void>;
}

export interface UploadedFileResult {
    publicUrl: string;
    key: string;
    originalName: string;
    mimeType: string | false;
    size: number;
}

/**
 * Creates an entity with associated file uploads
 * Handles the create → upload → update pattern automatically
 *
 * @param options Configuration options
 * @returns The created entity with files uploaded
 * @throws Error if entity creation or file upload fails
 */
export async function createEntityWithFiles<T extends mongoose.Document>(
    options: CreateEntityWithFilesOptions<T>
): Promise<T> {
    const {createEntity, files, getPrefixFn, updateEntity, rollbackEntity} = options;

    // Step 1: Create the entity to get its ID
    const entity = await createEntity();

    // Step 2: If no files, return entity as-is
    if (!files) {
        return entity;
    }

    try {
        // Step 3: Generate prefix using entity ID
        const entityId = (entity._id as mongoose.Types.ObjectId).toString();
        const prefix = getPrefixFn(entityId);

        // Step 4: Upload files
        const uploadResults = Array.isArray(files)
            ? await uploadFiles(files, prefix)
            : [await uploadFile(files, prefix)];

        // Step 5: Extract file keys/public URL
        const fileKeys = uploadResults.map((result) => result.publicUrl);

        // Step 6: Update entity with file keys
        await updateEntity(entity, fileKeys);

        return entity;
    }
    catch (error) {
        // If upload fails and rollback is provided, delete the entity
        if (rollbackEntity) {
            try {
                await rollbackEntity(entity);
            }
            catch (rollbackError) {
                console.error("Failed to rollback entity after upload failure:", rollbackError);
                // Log but don't throw - we want to preserve the original error
            }
        }

        // Re-throw the original error
        throw error;
    }
}

/**
 * Updates an entity with additional file uploads
 *
 * This is for scenarios where you're adding files to an existing entity
 *
 * @example
 * ```ts
 * await updateEntityWithFiles({
 *   entityId: forumId,
 *   files: req.files,
 *   getPrefixFn: (entityId) => prefixForumFile(courseId, entityId),
 *   updateEntity: async (fileKeys) => {
 *     await ForumModel.findByIdAndUpdate(forumId, {
 *       $push: { key: { $each: fileKeys } }
 *     });
 *   },
 * });
 * ```
 */
export interface UpdateEntityWithFilesOptions {
    /**
     * The ID of the entity to update
     */
    entityId: string;

    /**
     * Files to upload (single file or array of files)
     */
    files: Express.Multer.File | Express.Multer.File[];

    /**
     * Function that generates the file prefix using the entity ID
     */
    getPrefixFn: (entityId: string) => string;

    /**
     * Function that updates the entity with the uploaded file keys
     * @param fileKeys - Array of uploaded file keys
     */
    updateEntity: (fileKeys: string[]) => Promise<void>;
}

/**
 * Updates an existing entity with file uploads
 *
 * @param options Configuration options
 * @returns Array of uploaded file results
 */
export async function updateEntityWithFiles(
    options: UpdateEntityWithFilesOptions
): Promise<UploadedFileResult[]> {
    const {entityId, files, getPrefixFn, updateEntity} = options;

    // Step 1: Generate prefix
    const prefix = getPrefixFn(entityId);

    // Step 2: Upload files
    const uploadResults = Array.isArray(files)
        ? await uploadFiles(files, prefix)
        : [await uploadFile(files, prefix)];

    // Step 3: Extract file keys
    const fileKeys = uploadResults.map((result) => result.key);

    // Step 4: Update entity
    await updateEntity(fileKeys);

    return uploadResults;
}

