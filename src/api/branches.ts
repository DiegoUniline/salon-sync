import api from "@/lib/api";
import type { Branch } from "@/lib/mockData";

export const getBranches = async (): Promise<Branch[]> => {
  return api.branches.getAll();
};
