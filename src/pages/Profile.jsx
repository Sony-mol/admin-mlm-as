import React from "react";

export default function Profile() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="p-5 border-b border-[rgb(var(--border))]">
          <h2 className="font-medium">Account</h2>
        </div>

        <div className="p-5 grid gap-4 md:grid-cols-2">
          {/* First Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm opacity-80">First name</label>
            <input
              value="Rahul"
              readOnly
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm opacity-80">Last name</label>
            <input
              value="Sharma"
              readOnly
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm opacity-80">Email address</label>
            <input
              value="rahul@example.com"
              readOnly
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
