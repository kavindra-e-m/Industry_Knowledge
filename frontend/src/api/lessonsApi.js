import { getLessonsWarnings, getLessonsPatterns, getEquipmentWarnings } from "../services/api";

export { getLessonsWarnings, getLessonsPatterns, getEquipmentWarnings };
export const fetchPatterns = () => getLessonsPatterns();
export const fetchWarningsForEquipment = (tagId) => getEquipmentWarnings(tagId);
