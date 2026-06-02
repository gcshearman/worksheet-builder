export interface Worksheet {
  title: string;
  module: string;
  sections: WorksheetSection[];
}

export interface WorksheetSection {
  id: string;
  title: string;
  description: string;
}