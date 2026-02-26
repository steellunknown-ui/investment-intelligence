"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { UsersRound, Plus, Eye, Trash2, User, Shield } from "lucide-react";
import type { FamilyMember } from "@/lib/types";

export default function FamilyHubPage() {
    const router = useRouter();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", relation: "" });

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/family");
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/family", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ name: "", email: "", relation: "" });
                fetchMembers();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to invite member");
            }
        } catch (error) {
            console.error("Invite error:", error);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!window.confirm("Remove this family member from monitoring?")) return;

        try {
            const res = await fetch(`/api/family/${id}`, { method: "DELETE" });
            if (res.ok) {
                setMembers((prev) => prev.filter((m) => m.id !== id));
            } else {
                alert("Failed to remove member");
            }
        } catch (error) {
            console.error("Remove error:", error);
        }
    };

    return (
        <DashboardShell
            title="Family Financial Hub"
            description="Monitor family members' financial portfolios in read-only mode"
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="icon-container bg-emerald-600">
                            <UsersRound className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Family Members</h2>
                            <p className="text-sm text-slate-500">Monitor portfolios in read-only mode</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Invite Member
                    </Button>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <EmptyState
                        icon={UsersRound}
                        title="No family members added"
                        description="Invite family members to monitor their financial portfolios in read-only mode."
                        action={{
                            label: "Invite Member",
                            onClick: () => setIsModalOpen(true),
                        }}
                        withCard={true}
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                            <Card key={member.id} className="hover:shadow-md transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="icon-container bg-blue-50 dark:bg-blue-900/20">
                                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <Badge variant="success">Monitoring</Badge>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            {member.member_profile?.full_name || "Unknown"}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">{member.relation}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Shield className="h-3 w-3" />
                                        <span>Read-Only Access</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-2"
                                        onClick={() => router.push(`/family/${member.member_user_id}`)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        View Dashboard
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemove(member.id)}
                                        className="hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Invite Family Member</DialogTitle>
                            <DialogDescription>
                                Enter the email of a registered user to monitor their portfolio.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <Input
                                label="Member Name"
                                placeholder="e.g. Rahul Sharma"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="member@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Input
                                label="Relation"
                                placeholder="e.g. Son, Wife, Daughter"
                                value={formData.relation}
                                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                required
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={submitting}
                                >
                                    {submitting ? "Inviting..." : "Invite Member"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardShell>
    );
}
