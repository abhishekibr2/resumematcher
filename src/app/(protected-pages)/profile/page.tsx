"use client"
import { ProfileContent } from "@/components/profile-content";
import { useEffect, useState } from "react";

export default function ProfilePage() {

  const [res, setRes] = useState({ user: {} });

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    const response = await fetch('/api/user/get-profile');
    const data = await response.json();
    setRes(data);
  }

  return (
    <div>
      <ProfileContent user={res.user} />
    </div>
  );
}
