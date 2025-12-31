import { inject } from "@angular/core";
import { Router, type CanActivateFn } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const { data } = await authService.getSession();

  if (data.session) {
    return true;
  }

  return router.createUrlTree(["/login"]);
};
