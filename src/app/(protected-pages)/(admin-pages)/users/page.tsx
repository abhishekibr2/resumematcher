import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { userTableConfig } from "@/config/Table/users";

export default function Dashboard() {
    return <div><TableComponent config={userTableConfig} /></div>;
}