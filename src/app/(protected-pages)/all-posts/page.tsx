import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { postsTableConfig } from "@/config/Table/posts";

export default function Dashboard() {
  return <div><TableComponent config={postsTableConfig} /></div>;
}