"use client";

import { PageHeader } from "@/components/layout/page-header";
import { restaurantAppetiteRules } from "@/data/rules-restaurant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UnderwritingRulesContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Underwriting Rules"
        description="Configurable deterministic appetite rules for restaurant and entertainment class (synthetic demo)."
      >
        <Badge variant="outline">Synthetic demo rules</Badge>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Restaurant & Entertainment Appetite Rules</CardTitle>
          <CardDescription>
            Decline results are recommendations only. The interface requires
            underwriter confirmation — risks are not automatically declined.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurantAppetiteRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs">{rule.id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </TableCell>
                  <TableCell className="text-sm">{rule.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rule.outcome === "decline"
                          ? "destructive"
                          : rule.outcome === "refer"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {rule.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.severity}</TableCell>
                  <TableCell>{rule.active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
