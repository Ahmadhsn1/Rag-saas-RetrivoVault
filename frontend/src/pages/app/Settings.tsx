import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto h-full max-w-2xl overflow-y-auto px-4 py-6 sm:px-6">
      <h2 className="mb-6 font-mono text-lg font-semibold">Settings</h2>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Name</Label>
                <Input id="s-name" value={user?.name ?? ""} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" value={user?.email ?? ""} readOnly />
              </div>
              <p className="font-mono text-2xs text-muted-foreground">
                Editing profile details isn't available in this build.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Retrivo Vault ships a single dark theme tuned for long reading
                sessions. A light theme is on the roadmap.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Sign out everywhere</p>
                  <p className="text-sm text-muted-foreground">
                    Clears your refresh session on this device.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await logout();
                    navigate("/login", { replace: true });
                  }}
                >
                  Sign out
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-sm font-medium">Delete account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently removes your account and all documents.
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="destructive" disabled>
                        Delete
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
