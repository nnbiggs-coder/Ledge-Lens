export {
  buildInitialSubmissions,
  initialSubmissions,
} from "./seed/index";

import { initialSubmissions } from "./seed/index";

/** @deprecated Use useDemo() or buildInitialSubmissions() for live state */
export const submissions = initialSubmissions;
