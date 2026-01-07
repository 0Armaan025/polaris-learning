import { ShieldAlertIcon } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const UnauthenticatedView = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">

      <div className="w-full max-w-lg bg-muted">
        <Item variant="outline">
          <ItemMedia>
            <ShieldAlertIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Unauthorized access</ItemTitle>
            <ItemDescription>
              You are not allowed to view this resource!</ItemDescription>
          </ItemContent>
          <ItemActions>
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </ItemActions>
        </Item>
      </div>
    </div>
  );
}
