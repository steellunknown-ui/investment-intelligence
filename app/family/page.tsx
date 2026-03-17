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
import { UsersRound, Plus, Eye, Trash2, User, Shield, Search } from "lucide-react";
import type { FamilyMember } from "@/lib/types";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { GridTable } from "@/components/ui/GridTable";

export default function FamilyHubPage() {
    const router = useRouter();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", relation: "" });
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [searchQuery, setSearchQuery] = useState("");

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
    const filteredMembers = members.filter((member) => {
        const nameMatch = (member.member_name || member.member_profile?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const emailMatch = (member.member_profile?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
        const relationMatch = (member.relation || "").toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || emailMatch || relationMatch;
    });

    return (
        <DashboardShell
            title="Family Financial Hub"
            description="Monitor family members' financial portfolios in read-only mode"
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full">
                    <div className="flex flex-1 w-full sm:w-auto gap-2">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search family member..."
                                className="pl-9 bg-card"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90 text-white"
                        >
                            <Plus className="h-4 w-4" />
                            Invite Member
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <EmptyState
                        icon={UsersRound}
                        title="No matching members found"
                        description="Try refining your search terms."
                        withCard={true}
                    />
                ) : viewMode === "card" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredMembers.map((member) => (
                            <Card key={member.id} className="hover:shadow-md transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        {member.member_profile?.avatar_url ? (
                                            <img
                                                src={member.member_profile.avatar_url}
                                                alt={member.member_profile.full_name || "Avatar"}
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="icon-container bg-blue-50 dark:bg-blue-900/20">
                                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        )}
                                        <Badge variant="success">Monitoring</Badge>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-foreground">
                                            {member.member_name || member.member_profile?.full_name || member.member_profile?.email || "Unknown Family Member"}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">{member.relation}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3 border-t border-border pt-3 mt-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-primary dark:text-accent bg-primary/10 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                        <Shield className="h-4 w-4" />
                                        <span>Read-Only Access Enabled</span>
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
                ) : (
                    <GridTable
                        items={filteredMembers}
                        columns={[
                            {
                                key: "member_name",
                                label: "Member",
                                render: (m) => (
                                    <div className="flex items-center gap-3">
                                        {m.member_profile?.avatar_url ? (
                                            <img
                                                src={m.member_profile.avatar_url}
                                                alt={m.member_name || "Avatar"}
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {m.member_name || m.member_profile?.full_name || "Unknown"}
                                            </p>
                                            <p className="text-xs text-slate-500">{m.member_profile?.email}</p>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "relation",
                                label: "Relation",
                                render: (m) => (
                                    <Badge variant="outline" className="capitalize">
                                        {m.relation}
                                    </Badge>
                                ),
                            },
                            {
                                key: "status",
                                label: "Status",
                                render: () => <Badge variant="success">Monitoring</Badge>,
                            },
                        ]}
                        renderExtraActions={(m) => (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/family/${m.member_user_id}`)}
                                className="h-8 px-2 text-xs gap-1"
                            >
                                <Eye className="h-3 w-3" /> Dashboard
                            </Button>
                        )}
                        onDelete={(m) => handleRemove(m.id)}
                    />
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
                                    className="bg-primary hover:bg-primary/90 text-white"
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
