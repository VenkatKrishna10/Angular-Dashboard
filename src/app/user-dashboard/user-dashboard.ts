import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, PLATFORM_ID, inject, ViewContainerRef, ComponentRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User, UserService } from '../user';
import { Subscription } from 'rxjs';
import type { UserFormComponent } from '../user-form/user-form';
import type { Chart as ChartInstance, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.html'
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  private subscription!: Subscription;
  private ChartCtor?: typeof import('chart.js').Chart;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private userFormRef?: ComponentRef<UserFormComponent>;
  isModalVisible = false;
  isChartLoading = true;
  isFormLoading = false;
  searchTerm = '';
  roleFilter: User['role'] | 'All' = 'All';
  roleOptions: User['role'][] = ['Admin', 'Editor', 'Viewer'];
  editingUser?: User;
  selectedRole: User['role'] = 'Viewer';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('formHost', { read: ViewContainerRef }) formHost?: ViewContainerRef;
  chart?: ChartInstance<'pie', number[], string>;

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.subscription = this.userService.getUsers().subscribe(users => {
      this.users = users;
      this.applyFilters();
      this.updateChart();
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.loadChart();
    } else {
      this.isChartLoading = false;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.chart?.destroy();
    this.destroyUserForm();
  }

  async loadChart() {
    this.isChartLoading = true;
    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      this.ChartCtor = Chart;
      this.createChart();
    } finally {
      this.isChartLoading = false;
      this.cdr.detectChanges();
    }
  }

  createChart() {
    if (!this.ChartCtor) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const roleCounts = this.getRoleCounts();
    const config: ChartConfiguration<'pie', number[], string> = {
      type: 'pie',
      data: {
        labels: Object.keys(roleCounts),
        datasets: [{
          data: Object.values(roleCounts),
          backgroundColor: ['#1c4980', '#383838', '#A9A9A9']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    };

    this.chart = new this.ChartCtor(this.chartRef.nativeElement, config);
  }

  updateChart() {
    if (this.isBrowser && this.chart) {
      const roleCounts = this.getRoleCounts();

      this.chart.data.labels = Object.keys(roleCounts);
      this.chart.data.datasets[0].data = Object.values(roleCounts);
      this.chart.update();
    }
  }

  private getRoleCounts(): Record<string, number> {
    return this.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async showModal() {
    this.isModalVisible = true;
    await this.loadUserForm();
  }

  hideModal() {
    this.isModalVisible = false;
    this.destroyUserForm();
  }

  onUserAdded(user: User) {
    this.userService.addUser(user);
    this.hideModal();
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  onRoleFilterChange(value: string) {
    this.roleFilter = value as User['role'] | 'All';
    this.currentPage = 1;
    this.applyFilters();
  }

  startRoleEdit(user: User) {
    this.editingUser = user;
    this.selectedRole = user.role;
  }

  saveRoleSelection(user: User, role: string) {
    this.userService.updateUserRole(user, role as User['role']);
    this.cancelRoleEdit();
  }

  cancelRoleEdit() {
    this.editingUser = undefined;
  }

  goToPage(page: number) {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
    this.updatePaginatedUsers();
  }

  private applyFilters() {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !normalizedSearch
        || user.name.toLowerCase().includes(normalizedSearch)
        || user.email.toLowerCase().includes(normalizedSearch)
        || user.role.toLowerCase().includes(normalizedSearch);
      const matchesRole = this.roleFilter === 'All' || user.role === this.roleFilter;

      return matchesSearch && matchesRole;
    });

    this.totalPages = Math.max(Math.ceil(this.filteredUsers.length / this.pageSize), 1);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginatedUsers();
  }

  private updatePaginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  private async loadUserForm() {
    if (this.userFormRef || !this.formHost) {
      return;
    }

    this.isFormLoading = true;
    const { UserFormComponent } = await import('../user-form/user-form');
    this.formHost.clear();
    this.userFormRef = this.formHost.createComponent(UserFormComponent);
    this.userFormRef.instance.userAdded.subscribe(user => this.onUserAdded(user));
    this.userFormRef.instance.closeModal.subscribe(() => this.hideModal());
    this.isFormLoading = false;
  }

  private destroyUserForm() {
    this.userFormRef?.destroy();
    this.userFormRef = undefined;
    this.formHost?.clear();
  }
}
