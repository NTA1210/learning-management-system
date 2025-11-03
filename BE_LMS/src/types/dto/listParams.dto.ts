export default interface ListParams {
    page: number;
    limit: number;
    search?: string;
    createdAt?: Date;
    updatedAt?: Date;
    sortBy?: string;
    sortOrder?: string;
}