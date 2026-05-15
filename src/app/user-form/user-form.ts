import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../user';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html'
})
export class UserFormComponent {
  @Output() userAdded = new EventEmitter<User>();
  @Output() closeModal = new EventEmitter<void>();

  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Viewer', Validators.required]
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.userAdded.emit(this.userForm.value);
      this.userForm.reset({ role: 'Viewer' });
    }
  }

  onCancel() {
    this.closeModal.emit();
  }
}
