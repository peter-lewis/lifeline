import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Local copy of the usual `cn`.
 *
 * The component deliberately does NOT take a registryDependency on
 * shadcn's `utils` item: that file type-imports `@tanstack/vue-table`,
 * so installing this timeline into a project without the table package
 * produced a type error in a file the consumer never asked for. Two
 * lines here keeps the block self-contained and installable anywhere.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
