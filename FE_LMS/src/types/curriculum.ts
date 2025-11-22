import type { Subject } from "./subject";
import type { Course } from "./course";
import type { Specialist } from "./specialist";
import type { Major } from "./specialist";

export interface PrerequisiteSubject {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

export interface SubjectNode extends Subject {
  courses?: Course[];
  coursesLoaded?: boolean;
  coursesLoading?: boolean;
  coursesError?: string;
  prerequisitesLoaded?: boolean;
  prerequisitesLoading?: boolean;
  prerequisitesError?: string;
  prerequisiteSubjects?: PrerequisiteSubject[];
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

