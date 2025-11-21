import type { Subject } from "./subject";
import type { Course } from "./course";
import type { Specialist } from "./specialist";
import type { Major } from "./specialist";

export interface SubjectNode extends Subject {
  courses?: Course[];
  coursesLoaded?: boolean;
  coursesLoading?: boolean;
  coursesError?: string;
}

export interface SpecialistNode extends Specialist {
  subjects?: SubjectNode[];
  subjectsLoaded?: boolean;
  subjectsLoading?: boolean;
  subjectsError?: string;
}

export interface MajorNode extends Major {
  specialists?: SpecialistNode[];
  specialistsLoaded?: boolean;
  specialistsLoading?: boolean;
  specialistsError?: string;
}

