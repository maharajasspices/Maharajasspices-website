import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Shield, UserPlus } from "lucide-react";
import { z } from "zod";
import { getSecureErrorMessage } from "@/utils/errorHandling";
import { isAdminEmail } from "@/lib/admin";

const emailSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters")
});

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

const RoleManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"employee" | "admin">("employee");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      const isAdminUser = isAdminEmail(session.user.email);
      
      if (!hasAdminRole && !isAdminUser) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You need admin privileges to access this page.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchUsersWithRoles();
    } catch (error) {
      console.error("Error checking admin role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithRoles = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || "No email",
        created_at: profile.created_at,
        roles: userRoles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    }
  };

  const handleAddRole = async () => {
    try {
      // Validate email
      const validated = emailSchema.parse({ email: selectedEmail });
      setAddingRole(true);

      // Call the database function to add role
      const { error } = await supabase.rpc("add_employee_role", {
        user_email: validated.email
      });

      if (error) throw error;

      toast({
        title: "Role Added",
        description: `${selectedRole} role added to ${validated.email}`,
      });

      setSelectedEmail("");
      await fetchUsersWithRoles();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: error.errors[0]?.message || "Please enter a valid email.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: getSecureErrorMessage(error),
        });
      }
    } finally {
      setAddingRole(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: "admin" | "customer" | "employee") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `${role} role has been removed.`,
      });

      await fetchUsersWithRoles();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Role Management</h1>
          </div>

          {/* Add Role Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Employee Role
              </CardTitle>
              <CardDescription>
                Grant employee or admin privileges to users by email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={selectedRole} onValueChange={(value: "employee" | "admin") => setSelectedRole(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={addingRole || !selectedEmail}>
                  {addingRole ? "Adding..." : "Add Role"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({users.length})</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline">customer</Badge>
                      ) : (
                        user.roles.map((role) => {
                          const typedRole = role as "admin" | "customer" | "employee";
                          return (
                            <div key={role} className="flex items-center gap-1">
                              <Badge variant={typedRole === "admin" ? "default" : "secondary"}>
                                {role}
                              </Badge>
                              {typedRole !== "customer" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRole(user.id, typedRole)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoleManagement;
