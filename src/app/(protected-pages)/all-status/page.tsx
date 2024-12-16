import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { statusTableConfig } from "@/config/Table/status";

export default function Dashboard() {
  return <div><TableComponent config={statusTableConfig} /></div>;
}