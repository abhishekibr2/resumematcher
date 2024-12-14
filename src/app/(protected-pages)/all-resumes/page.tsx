import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { resumeTableConfig } from "@/config/Table/resume";

export default function Dashboard() {
  return <div><TableComponent config={resumeTableConfig} /></div>;
}