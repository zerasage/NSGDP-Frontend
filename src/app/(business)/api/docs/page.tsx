import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ApiDocsPage() {
  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-8">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="mt-2 text-muted-foreground">
            Programmatic access to Niger State Open Data
          </p>
        </Container>
      </div>

      <Container className="py-12">
        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Niger State Open Data Portal provides a RESTful API for programmatic
                access to datasets, development partners, and groups. All responses are in JSON
                format.
              </p>
              <div>
                <p className="text-sm font-medium mb-2">Base URL</p>
                <code className="block bg-muted px-4 py-2 rounded-lg text-sm">
                  https://opendata.niger.gov.ng/api/v1
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Public endpoints do not require authentication. For restricted datasets
                and write operations, include your API key in the request header:
              </p>
              <code className="block bg-muted px-4 py-2 rounded-lg text-sm">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Datasets */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/datasets</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  List all datasets with optional filters (groups, development partners, lgas,
                  formats, visibility, status, sort, page, pageSize)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/datasets/:slug</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get a single dataset by slug
                </p>
              </div>

              {/* Development Partners */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/development-partners</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  List all development partners with optional sector filter
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/development-partners/:slug</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get a single development partner by slug
                </p>
              </div>

              {/* Groups */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/groups</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  List all thematic groups
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/groups/:slug</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get a single group by slug
                </p>
              </div>

              {/* Search */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/search?q=query</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search across datasets, development partners, and groups
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Unauthenticated requests: 60 requests per hour per IP address
                <br />
                Authenticated requests: 1000 requests per hour per API key
              </p>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For API support and to request an API key, contact{" "}
                <a
                  href="mailto:opendata@niger.gov.ng"
                  className="text-primary hover:underline"
                >
                  opendata@niger.gov.ng
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
