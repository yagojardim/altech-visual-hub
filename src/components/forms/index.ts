export { FormField, type FormFieldProps, type FormFieldState } from "./FormField";
export { MultiSelectPlaceholder } from "./MultiSelect";
export {
  DatePickerFieldPlaceholder,
  TimePickerFieldPlaceholder,
  UserSelectorPlaceholder,
  TagSelectorPlaceholder,
  UploadFieldPlaceholder,
} from "./FieldPlaceholders";

// Re-export existing shadcn form primitives so consumers can import the full
// form foundation from a single location without moving files.
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Checkbox } from "@/components/ui/checkbox";
export { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
export { Switch } from "@/components/ui/switch";
export { Label } from "@/components/ui/label";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
