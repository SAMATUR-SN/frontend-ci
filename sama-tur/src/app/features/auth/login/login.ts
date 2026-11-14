import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MESSAGE_SESSION_EXPIREE, messageErreurConnexion } from './login-messages';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  // /login?raison=session : l'intercepteur ou une garde nous renvoie ici après une fin de session.
  private readonly parametres = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly sessionExpiree = computed(() => this.parametres().get('raison') === 'session');
  protected readonly messageSessionExpiree = MESSAGE_SESSION_EXPIREE;

  protected readonly loginForm = this.fb.nonNullable.group({
    identifiant: ['', Validators.required],
    motDePasse: ['', Validators.required]
  });

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (erreur: HttpErrorResponse) => {
        this.errorMessage.set(messageErreurConnexion(erreur.status));
        this.loading.set(false);
      }
    });
  }
}