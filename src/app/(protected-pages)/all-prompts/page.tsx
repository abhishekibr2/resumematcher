import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { promptsTableConfig } from "@/config/Table/prompts";

export default function Dashboard() {
  return <div><TableComponent config={promptsTableConfig} /></div>;
}