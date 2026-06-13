export type UserGender = "male" | "female" | "other";

export const GENDER_OPTIONS: { label: string; value: UserGender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];
