package com.example.trello.config;

import com.example.trello.constants.ListTaskStatus;
import com.example.trello.constants.NotificationChannel;
import com.example.trello.constants.NotificationStatus;
import com.example.trello.constants.NotificationType;
import com.example.trello.constants.RoleName;
import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Notification;
import com.example.trello.model.Project;
import com.example.trello.model.Role;
import com.example.trello.model.Task;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.ListTaskRepository;
import com.example.trello.repository.NotificationRepository;
import com.example.trello.repository.ProjectRepository;
import com.example.trello.repository.RoleRepository;
import com.example.trello.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class DataSeed implements CommandLineRunner {

    private static final int SEED_SIZE = 10;
    private static final String DEFAULT_PASSWORD = "123456";
    private static final String LEGACY_PROJECT_PREFIX = "Seed Project";
    private static final String LEGACY_TASK_PREFIX = "Seed Task";
    private static final String LEGACY_NOTIFICATION_PREFIX = "Seed Notification";
    private static final String PROJECT_PREFIX = "Project ";
    private static final String TASK_PREFIX = "KANBAN-SEED-TASK";
    private static final String NOTIFICATION_PREFIX = "KANBAN-SEED-NOTI";
        private static final List<ListTaskStatus> DEFAULT_PROJECT_STATUSES = List.of(
            ListTaskStatus.TO_DO,
            ListTaskStatus.IN_PROGRESS,
            ListTaskStatus.REVIEW,
            ListTaskStatus.DONE);

    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final ProjectRepository projectRepository;
    private final ListTaskRepository listTaskRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;

    @Autowired
    public DataSeed(
            PasswordEncoder passwordEncoder,
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            ProjectRepository projectRepository,
            ListTaskRepository listTaskRepository,
            TaskRepository taskRepository,
            NotificationRepository notificationRepository) {
        this.passwordEncoder = passwordEncoder;
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.projectRepository = projectRepository;
        this.listTaskRepository = listTaskRepository;
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureRoles();
        Account admin = ensureAdminAccount();

        seedAccounts();
        seedProjects(admin);
    }

    private void ensureRoles() {
        List<RoleName> requiredRoles = List.of(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.USER);
        for (RoleName roleName : requiredRoles) {
            if (roleRepository.findRoleByName(roleName).isEmpty()) {
                roleRepository.save(new Role(roleName));
            }
        }
    }

    private Account ensureAdminAccount() {
        String adminEmail = "admin@gmail.com";

        Optional<Account> existingAdmin = accountRepository.findUserByEmail(adminEmail);
        if (existingAdmin.isPresent()) {
            Account admin = existingAdmin.get();
            // Ensure admin has both SUPER_ADMIN and ADMIN roles
            Role superAdminRole = roleRepository.findRoleByName(RoleName.SUPER_ADMIN)
                    .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role is missing"));
            Role adminRole = roleRepository.findRoleByName(RoleName.ADMIN)
                    .orElseThrow(() -> new IllegalStateException("ADMIN role is missing"));
            admin.addRole(superAdminRole);
            admin.addRole(adminRole);
            accountRepository.save(admin);
            return admin;
        }

        Role superAdminRole = roleRepository.findRoleByName(RoleName.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role is missing"));
        Role adminRole = roleRepository.findRoleByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role is missing"));

        Account newAdmin = new Account();
        newAdmin.setUsername("admin");
        newAdmin.setEmail(adminEmail);
        newAdmin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        newAdmin.setLogin(true);
        newAdmin.setActive(true);
        newAdmin.setDeleted(false);
        newAdmin.addRole(superAdminRole);
        newAdmin.addRole(adminRole);

        return accountRepository.save(newAdmin);
    }

    private List<Account> seedAccounts() {
        Role userRole = roleRepository.findRoleByName(RoleName.USER)
                .orElseThrow(() -> new IllegalStateException("USER role is missing"));

        List<AccountSeedData> accountSeeds = buildAccountSeeds();

        for (AccountSeedData seed : accountSeeds) {
            if (accountRepository.findUserByEmail(seed.email()).isPresent()) {
                continue;
            }

            Account account = new Account();
            account.setUsername(seed.username());
            account.setEmail(seed.email());
            account.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
            account.setAvatarUrl(seed.avatarUrl());
            account.setLogin(seed.login());
            account.setActive(true);
            account.setDeleted(false);
            account.addRole(userRole);
            accountRepository.save(account);
        }

        List<Account> seededAccounts = new ArrayList<>();
        for (AccountSeedData seed : accountSeeds) {
            Account account = accountRepository.findUserByEmail(seed.email())
                    .orElseThrow(() -> new IllegalStateException("Seed account missing: " + seed.email()));
            seededAccounts.add(account);
        }

        return seededAccounts;
    }

    private List<Project> seedProjects(Account admin) {
        List<ProjectSeedData> projectSeeds = buildProjectSeeds();

        for (ProjectSeedData seed : projectSeeds) {
            Project existing = projectRepository.findProjectByTitle(seed.title());
            if (existing == null) {
                Project project = Project.builder()
                        .title(seed.title())
                        .description(seed.description())
                        .isPublic(seed.isPublic())
                        .isDeleted(false)
                        .createdBy(admin.getEmail())
                        .build();
                Project savedProject = projectRepository.save(project);
                ensureDefaultListTaskStatuses(savedProject);
                continue;
            }

            boolean changed = false;
            if (existing.isDeleted()) {
                existing.setDeleted(false);
                changed = true;
            }
            if (!seed.description().equals(existing.getDescription())) {
                existing.setDescription(seed.description());
                changed = true;
            }
            if (existing.isPublic() != seed.isPublic()) {
                existing.setPublic(seed.isPublic());
                changed = true;
            }
            if (changed) {
                projectRepository.save(existing);
            }

            ensureDefaultListTaskStatuses(existing);
        }

        return projectSeeds.stream()
                .map(ProjectSeedData::title)
                .map(projectRepository::findProjectByTitle)
                .filter(project -> project != null && !project.isDeleted())
                .sorted(Comparator.comparing(Project::getId))
                .toList();
    }

    private void ensureDefaultListTaskStatuses(Project project) {
        List<ListTask> existingColumns = listTaskRepository.findAllByProjectId(project.getId());
        Map<ListTaskStatus, Long> existingOrderByStatus = existingColumns.stream()
                .collect(Collectors.toMap(ListTask::getStatus, ListTask::getOrderIndex, (left, right) -> left));

        List<ListTask> missingColumns = new ArrayList<>();
        for (int index = 0; index < DEFAULT_PROJECT_STATUSES.size(); index++) {
            ListTaskStatus status = DEFAULT_PROJECT_STATUSES.get(index);
            if (existingOrderByStatus.containsKey(status)) {
                continue;
            }

            missingColumns.add(ListTask.builder()
                    .status(status)
                    .orderIndex((long) index)
                    .project(project)
                    .build());
        }

        if (!missingColumns.isEmpty()) {
            listTaskRepository.saveAll(missingColumns);
        }
    }

    private Map<Long, Map<ListTaskStatus, ListTask>> rebuildProjectColumns(List<Project> projects) {
        List<ListTaskStatus> statuses = List.of(
                ListTaskStatus.TO_DO,
                ListTaskStatus.IN_PROGRESS,
                ListTaskStatus.REVIEW,
                ListTaskStatus.DONE);

        Map<Long, Map<ListTaskStatus, ListTask>> columnsByProjectId = new HashMap<>();

        for (Project project : projects) {
            List<ListTask> existingColumns = listTaskRepository.findAllByProjectId(project.getId());
            if (!existingColumns.isEmpty()) {
                List<Long> taskIdsInProjectColumns = existingColumns.stream()
                        .flatMap(column -> column.getTaskList().stream())
                        .map(Task::getId)
                        .filter(id -> id != null)
                        .distinct()
                        .toList();

                if (!taskIdsInProjectColumns.isEmpty()) {
                    List<Notification> linkedNotifications = notificationRepository.findByTaskIdIn(taskIdsInProjectColumns);
                    if (!linkedNotifications.isEmpty()) {
                        notificationRepository.deleteAll(linkedNotifications);
                    }
                }

                listTaskRepository.deleteAll(existingColumns);
            }

            List<ListTask> columns = new ArrayList<>();
            for (int index = 0; index < statuses.size(); index++) {
                columns.add(ListTask.builder()
                        .status(statuses.get(index))
                        .orderIndex((long) index)
                        .project(project)
                        .build());
            }
            List<ListTask> savedColumns = listTaskRepository.saveAll(columns);

            Map<ListTaskStatus, ListTask> statusToColumn = new HashMap<>();
            for (ListTask column : savedColumns) {
                statusToColumn.put(column.getStatus(), column);
            }
            columnsByProjectId.put(project.getId(), statusToColumn);
        }

        return columnsByProjectId;
    }

    private List<Task> seedTasks(
            List<Account> accounts,
            List<Project> projects,
            Map<Long, Map<ListTaskStatus, ListTask>> columnsByProjectId) {
        removeSeedNotifications();
        removeSeedTasks();

        if (accounts.isEmpty() || projects.isEmpty()) {
            return List.of();
        }

        List<TaskSeedData> taskSeeds = buildTaskSeeds(projects, accounts);
        List<Task> seededTasks = new ArrayList<>();

        for (TaskSeedData seed : taskSeeds) {
            Project project = seed.project();
            Map<ListTaskStatus, ListTask> statusToColumn = columnsByProjectId.get(project.getId());
            if (statusToColumn == null || statusToColumn.isEmpty()) {
                continue;
            }

            ListTask targetColumn = statusToColumn.get(seed.status());
            if (targetColumn == null) {
                continue;
            }

            Task task = Task.builder()
                    .title(seed.title())
                    .description(seed.description())
                    .orderIndex(seed.orderIndex())
                    .isActive(true)
                    .dueDate(seed.dueDate())
                    .reminderDate(seed.reminderDate())
                    .listTask(targetColumn)
                    .assignedAccount(seed.assignee())
                    .build();

            seededTasks.add(taskRepository.save(task));
        }

        return seededTasks;
    }

    private void seedNotifications(List<Account> accounts, List<Task> tasks) {
        removeSeedNotifications();

        if (accounts.isEmpty()) {
            return;
        }

        List<NotificationSeedData> notificationSeeds = buildNotificationSeeds(accounts, tasks);

        for (NotificationSeedData seed : notificationSeeds) {
            Notification notification = Notification.builder()
                    .recipientAccount(seed.recipient())
                    .task(seed.task())
                    .type(seed.type())
                    .channel(seed.channel())
                    .status(seed.status())
                    .isRead(seed.read())
                    .retryCount(seed.retryCount())
                    .title(seed.title())
                    .message(seed.message())
                    .scheduledAt(seed.scheduledAt())
                    .deliveredAt(seed.deliveredAt())
                    .build();

            notificationRepository.save(notification);
        }
    }

    private void removeSeedNotifications() {
        List<Notification> toDelete = notificationRepository.findAll().stream()
                .filter(notification -> startsWith(notification.getTitle(), NOTIFICATION_PREFIX)
                        || startsWith(notification.getTitle(), LEGACY_NOTIFICATION_PREFIX))
                .toList();

        if (!toDelete.isEmpty()) {
            notificationRepository.deleteAll(toDelete);
        }
    }

    private void removeSeedTasks() {
        List<Task> toDelete = taskRepository.findAll().stream()
                .filter(task -> startsWith(task.getTitle(), TASK_PREFIX)
                        || startsWith(task.getTitle(), LEGACY_TASK_PREFIX))
                .toList();

        if (!toDelete.isEmpty()) {
            List<Long> taskIds = toDelete.stream()
                .map(Task::getId)
                .collect(Collectors.toList());

            List<Notification> linkedNotifications = notificationRepository.findByTaskIdIn(taskIds);
            if (!linkedNotifications.isEmpty()) {
            notificationRepository.deleteAll(linkedNotifications);
            }

            taskRepository.deleteAll(toDelete);
            taskRepository.flush();
        }
    }

    private boolean startsWith(String value, String prefix) {
        return value != null && value.startsWith(prefix);
    }

    private List<AccountSeedData> buildAccountSeeds() {
        return List.of(
                new AccountSeedData("hung", "hung@gmail.com", "https://i.pravatar.cc/150?img=11", true),
                new AccountSeedData("linh", "linh@gmail.com", "https://i.pravatar.cc/150?img=12", true),
                new AccountSeedData("duong", "duong@gmail.com", "https://i.pravatar.cc/150?img=13", true),
                new AccountSeedData("hai", "hai@gmail.com", "https://i.pravatar.cc/150?img=14", false),
                new AccountSeedData("hieu", "hieu@gmail.com", "https://i.pravatar.cc/150?img=15", true),
                new AccountSeedData("tam", "nhan@gmail.com", "https://i.pravatar.cc/150?img=16", false),
                new AccountSeedData("trieu", "trieu@gmail.com", "https://i.pravatar.cc/150?img=17", true),
                new AccountSeedData("ngan", "ngan@gmail.com", "https://i.pravatar.cc/150?img=18", false),
                new AccountSeedData("van", "van@gmail.com", "https://i.pravatar.cc/150?img=19", false),
                new AccountSeedData("thao", "thao@gmail.com", "https://i.pravatar.cc/150?img=20", true),
                new AccountSeedData("hau", "hau@gmail.com", "https://i.pravatar.cc/150?img=20", true));
    }

    private List<ProjectSeedData> buildProjectSeeds() {
        return List.of(
                new ProjectSeedData(PROJECT_PREFIX + "Website Redesign",
                        "Refresh landing page, navigation and onboarding funnel.", true),
                new ProjectSeedData(PROJECT_PREFIX + "Mobile Performance",
                        "Reduce app startup time and optimize list rendering.", true),
                new ProjectSeedData(PROJECT_PREFIX + "Payment Stability",
                        "Improve payment retries and transaction reconciliation.", false),
                new ProjectSeedData(PROJECT_PREFIX + "Notification Revamp",
                        "Unify web and email notification templates.", true),
                new ProjectSeedData(PROJECT_PREFIX + "Security Hardening",
                        "Apply OWASP baseline and strengthen token lifecycle.", false),
                new ProjectSeedData(PROJECT_PREFIX + "Customer Support Portal",
                        "Build ticket timeline and response SLA dashboards.", true),
                new ProjectSeedData(PROJECT_PREFIX + "Analytics Dashboard",
                        "Track active users, conversion and retention metrics.", true),
                new ProjectSeedData(PROJECT_PREFIX + "Team Chat Improvements",
                        "Improve message delivery and unread counters.", true),
                new ProjectSeedData(PROJECT_PREFIX + "Data Migration",
                        "Migrate historical board data into new schema.", false),
                new ProjectSeedData(PROJECT_PREFIX + "QA Automation",
                        "Expand smoke tests for auth, board and notification flows.", true));
    }

    private List<TaskSeedData> buildTaskSeeds(List<Project> projects, List<Account> accounts) {
        LocalDateTime base = LocalDateTime.now().withSecond(0).withNano(0);

        return List.of(
                new TaskSeedData(" Define homepage sections",
                        "Document hero, trust signals and CTA blocks for redesign.", projects.get(0), accounts.get(5),
                        ListTaskStatus.TO_DO, 1L, base.plusDays(7), base.plusDays(3)),
                new TaskSeedData(" Optimize Android startup",
                        "Profile cold start and remove blocking initialization path.", projects.get(1), accounts.get(6),
                        ListTaskStatus.IN_PROGRESS, 2L, base.plusDays(6), base.plusDays(2)),
                new TaskSeedData(" Retry failed settlements",
                        "Implement safe retry policy for gateway timeout responses.", projects.get(2), accounts.get(1),
                        ListTaskStatus.REVIEW, 3L, base.plusDays(5), base.plusDays(2)),
                new TaskSeedData(" Draft unified email template",
                        "Create shared template blocks for assignment and reminder emails.", projects.get(3),
                        accounts.get(2), ListTaskStatus.DONE, 4L, base.plusDays(4), base.plusDays(1)),
                new TaskSeedData(" Rotate JWT signing secret",
                        "Introduce secret rotation policy and key version checks.", projects.get(4), accounts.get(9),
                        ListTaskStatus.IN_PROGRESS, 5L, base.plusDays(9), base.plusDays(5)),
                new TaskSeedData(" Build ticket timeline widget",
                        "Render event timeline with actor and resolution markers.", projects.get(5), accounts.get(8),
                        ListTaskStatus.TO_DO, 6L, base.plusDays(10), base.plusDays(6)),
                new TaskSeedData(" Add weekly retention chart",
                        "Expose cohort API and draw retention sparkline widgets.", projects.get(6), accounts.get(7),
                        ListTaskStatus.REVIEW, 7L, base.plusDays(8), base.plusDays(4)),
                new TaskSeedData(" Unread counter sync",
                        "Fix stale unread badge after conversation refresh.", projects.get(7), accounts.get(0),
                        ListTaskStatus.IN_PROGRESS, 8L, base.plusDays(3), base.plusDays(1)),
                new TaskSeedData(" Map legacy board IDs",
                        "Prepare mapping table from old board ids to new project ids.", projects.get(8),
                        accounts.get(1), ListTaskStatus.DONE, 9L, base.plusDays(12), base.plusDays(7)),
                new TaskSeedData(" Smoke test login flow",
                        "Automate login, board load and task drag-drop smoke test.", projects.get(9), accounts.get(3),
                        ListTaskStatus.TO_DO, 10L, base.plusDays(2), base.plusHours(20)));
    }

    private List<NotificationSeedData> buildNotificationSeeds(List<Account> accounts, List<Task> tasks) {
        LocalDateTime base = LocalDateTime.now().withSecond(0).withNano(0);

        List<NotificationSeedData> seeds = new ArrayList<>();
        for (int i = 0; i < SEED_SIZE; i++) {
            Account recipient = accounts.get(i % accounts.size());
            Task task = tasks.isEmpty() ? null : tasks.get(i % tasks.size());

            NotificationType type;
            NotificationChannel channel;
            NotificationStatus status;
            boolean isRead;
            int retryCount;
            LocalDateTime deliveredAt;

            if (i % 4 == 0) {
                type = NotificationType.TASK_ASSIGNED;
                channel = NotificationChannel.WEB;
                status = NotificationStatus.SENT;
                isRead = true;
                retryCount = 0;
                deliveredAt = base.minusHours(i + 1L);
            } else if (i % 4 == 1) {
                type = NotificationType.TASK_REMINDER;
                channel = NotificationChannel.EMAIL;
                status = NotificationStatus.PENDING;
                isRead = false;
                retryCount = 0;
                deliveredAt = null;
            } else if (i % 4 == 2) {
                type = NotificationType.TASK_DUE;
                channel = NotificationChannel.WEB;
                status = NotificationStatus.SENT;
                isRead = false;
                retryCount = 0;
                deliveredAt = base.minusHours(i);
            } else {
                type = NotificationType.ADMIN_MESSAGE;
                channel = NotificationChannel.EMAIL;
                status = NotificationStatus.FAILED;
                isRead = false;
                retryCount = 1;
                deliveredAt = null;
            }

            String taskTitle = task == null ? "General" : task.getTitle();
            String title = String.format("%s %s %02d - %s", NOTIFICATION_PREFIX, type.name(), i + 1, taskTitle);
            String message = String.format("[%s] %s - %s", channel.name(), recipient.getUsername(), taskTitle);

            seeds.add(new NotificationSeedData(
                    recipient,
                    task,
                    type,
                    channel,
                    status,
                    isRead,
                    retryCount,
                    title,
                    message,
                    base.minusHours(i + 2L),
                    deliveredAt));
        }

        return seeds;
    }

    private record AccountSeedData(String username, String email, String avatarUrl, boolean login) {
    }

    private record ProjectSeedData(String title, String description, boolean isPublic) {
    }

    private record TaskSeedData(
            String title,
            String description,
            Project project,
            Account assignee,
            ListTaskStatus status,
            long orderIndex,
            LocalDateTime dueDate,
            LocalDateTime reminderDate) {
    }

    private record NotificationSeedData(
            Account recipient,
            Task task,
            NotificationType type,
            NotificationChannel channel,
            NotificationStatus status,
            boolean read,
            int retryCount,
            String title,
            String message,
            LocalDateTime scheduledAt,
            LocalDateTime deliveredAt) {
    }

}
