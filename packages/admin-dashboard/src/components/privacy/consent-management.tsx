'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export function ConsentManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent Management</CardTitle>
        <CardDescription>
          Manage user consent preferences and privacy settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-consent">Require explicit consent</Label>
              <p className="text-sm text-muted-foreground">
                Users must explicitly consent to data processing
              </p>
            </div>
            <Switch id="require-consent" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics-consent">Analytics consent</Label>
              <p className="text-sm text-muted-foreground">
                Require consent for analytics data collection
              </p>
            </div>
            <Switch id="analytics-consent" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-consent">Marketing consent</Label>
              <p className="text-sm text-muted-foreground">
                Require consent for marketing communications
              </p>
            </div>
            <Switch id="marketing-consent" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="consent-text">Consent text</Label>
            <Textarea
              id="consent-text"
              placeholder="Enter the consent text that users will see..."
              className="min-h-[100px]"
              defaultValue="By using this service, you consent to the collection and processing of your data as outlined in our privacy policy. You can withdraw consent at any time."
            />
          </div>
          
          <div className="flex gap-2">
            <Button>Save Changes</Button>
            <Button variant="outline">Preview Consent Form</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
