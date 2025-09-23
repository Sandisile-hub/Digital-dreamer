// Dashboard Main Controller
const dashboard = {
    // API Base URL
    API_BASE: 'http://localhost:5000/api',
    
    // Current user information
    currentUser: null,
    charts: {},
    lastUpdateTime: null,
    isLoading: false,

    // Initialize dashboard
    async initializeDashboard() {
        console.log('🚀 Starting dashboard initialization...');
        this.showLoading(true);
        this.isLoading = true;
        
        try {
            // Test API connection first
            await this.testAPIConnection();
            
            // Load current user
            await this.loadCurrentUser();
            
            // Set UI elements
            document.getElementById('current-user-name').textContent = this.currentUser.name;
            document.getElementById('current-user-role').textContent = this.currentUser.role.toUpperCase();
            
            // Set access controls
            this.setAccessControls();
            
            // Initialize charts
            this.charts.initializeAllCharts();
            
            // Load real data
            await this.loadAllDataFromDatabase();
            
            console.log('✅ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showNotification('Using sample data for demonstration.', 'warning');
            this.useSampleData();
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    },

    // Test API connection
    async testAPIConnection() {
        try {
            console.log('Testing API connection...');
            const response = await fetch(`${this.API_BASE}/health`);
            
            if (!response.ok) {
                throw new Error(`API health check failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ API connection successful:', data);
            return true;
            
        } catch (error) {
            console.error('❌ API connection failed:', error);
            throw new Error(`Cannot connect to server: ${error.message}`);
        }
    },

    // Use sample data as fallback
    useSampleData() {
        console.log('Using sample data...');
        
        const sampleUsers = this.generateSampleUsers();
        const sampleEvents = this.generateSampleEvents();
        const sampleBranches = this.generateSampleBranches();
        const sampleNews = this.generateSampleNews();
        const sampleAlumni = this.generateSampleAlumni();

        this.processUsersData(sampleUsers);
        this.processEventsData(sampleEvents);
        this.processBranchesData(sampleBranches);
        this.processNewsData(sampleNews);
        this.processAlumniData(sampleAlumni);

        this.charts.updateAllCharts(sampleUsers, sampleEvents, sampleBranches, sampleAlumni, sampleNews);
    },

    // Load current user
    async loadCurrentUser() {
        try {
            const sessionUser = sessionStorage.getItem('currentUser');
            if (sessionUser) {
                this.currentUser = JSON.parse(sessionUser);
            } else {
                const users = await this.fetchData('/users');
                if (users && users.length > 0) {
                    this.currentUser = users[0];
                } else {
                    this.currentUser = {
                        id: 1,
                        name: 'Demo User',
                        role: 'admin',
                        branch_id: 1
                    };
                }
            }
            console.log('✅ User loaded:', this.currentUser);
        } catch (error) {
            console.warn('Using default user due to error:', error);
            this.currentUser = {
                id: 1,
                name: 'Demo User',
                role: 'admin',
                branch_id: 1
            };
        }
    },

    // Set access controls
    setAccessControls() {
        const sections = ['overview', 'users', 'events', 'branches', 'alumni', 'news'];
        sections.forEach(section => {
            const accessBadge = document.getElementById(section + '-access');
            const accessLevel = this.getAccessLevel(section);
            accessBadge.textContent = this.getAccessText(accessLevel);
            accessBadge.className = 'access-badge ' + this.getAccessClass(accessLevel);
        });
    },

    getAccessLevel(section) {
        const role = this.currentUser?.role?.toLowerCase() || 'member';
        if (role === 'admin') return 'full';
        if (role === 'bec') return section === 'overview' || section === 'users' || section === 'events' || section === 'branches' ? 'partial' : 'read';
        return section === 'overview' || section === 'events' || section === 'news' ? 'read' : 'none';
    },

    getAccessText(level) {
        return { full: 'Full Access', partial: 'Partial Access', read: 'Read Only', none: 'No Access' }[level];
    },

    getAccessClass(level) {
        return { full: 'access-full', partial: 'access-partial', read: 'access-read', none: 'access-none' }[level];
    },

    // Load all data from database
    async loadAllDataFromDatabase() {
        const startTime = Date.now();
        
        try {
            console.log('📊 Loading real data from API...');
            
            // Load all data in parallel
            const [users, events, branches, news, alumni] = await Promise.all([
                this.fetchData('/users'),
                this.fetchData('/events'),
                this.fetchData('/branches'),
                this.fetchData('/news'),
                this.fetchData('/alumni') // You have a separate alumni table!
            ]);

            console.log('✅ All data loaded:', {
                users: users?.length || 0,
                events: events?.length || 0,
                branches: branches?.length || 0,
                news: news?.length || 0,
                alumni: alumni?.length || 0
            });

            // Process data with exact field names from your database
            this.processUsersData(users);
            this.processEventsData(events);
            this.processBranchesData(branches);
            this.processNewsData(news);
            this.processAlumniData(alumni); // Use real alumni data

            this.charts.updateAllCharts(users, events, branches, alumni, news);
            this.updateSystemStatus(startTime, true);
            
        } catch (error) {
            console.error('❌ Error loading real data:', error);
            this.updateSystemStatus(startTime, false);
            throw error;
        }
    },

    // Fetch data from API
    async fetchData(endpoint) {
        try {
            console.log(`🔍 Fetching: ${endpoint}`);
            const response = await fetch(`${this.API_BASE}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${endpoint}`);
            }
            
            const data = await response.json();
            console.log(`✅ ${endpoint}:`, data.length, 'items');
            
            return data;
            
        } catch (error) {
            console.error(`❌ Failed to fetch ${endpoint}:`, error);
            throw error;
        }
    },

    // Process users data - using EXACT field names from your database
    processUsersData(users) {
        console.log('🔧 PROCESSING USERS DATA with exact fields');
        
        if (!users || !Array.isArray(users) || users.length === 0) {
            console.error('❌ Invalid users data');
            return;
        }

        // Debug: Show first user structure
        console.log('🔍 First user fields:', Object.keys(users[0]));
        console.log('🔍 First user data:', users[0]);

        try {
            const totalMembers = users.length;
            
            // Count active members using exact 'status' field
            const activeMembers = users.filter(user => {
                return user.status && user.status.toString().toLowerCase() === 'active';
            }).length;
            
            // Count BEC members using exact 'is_bec_member' field
            const becMembers = users.filter(user => {
                return user.is_bec_member === true || user.is_bec_member === 'true';
            }).length;
            
            // Count NEC members using exact 'nec_position' field
            const necMembers = users.filter(user => {
                return user.nec_position !== null && user.nec_position !== undefined && user.nec_position !== '';
            }).length;
            
            // New members in last 30 days - using exact field names
            const newMembersMonth = users.filter(user => {
                if (!user.created_at) return false;
                
                try {
                    const joinDate = new Date(user.created_at);
                    const monthAgo = new Date();
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    return joinDate > monthAgo;
                } catch (dateError) {
                    return false;
                }
            }).length;

            console.log('📊 User statistics:', {
                totalMembers,
                activeMembers,
                becMembers,
                necMembers,
                newMembersMonth
            });

            // Update UI with real data
            this.updateMetric('total-members', totalMembers);
            this.updateMetric('active-members', activeMembers);
            this.updateMetric('bec-members', becMembers);
            this.updateMetric('nec-members', necMembers);
            this.updateMetric('new-members-month', newMembersMonth);

            // Calculate trends
            this.updateTrend('members-trend', this.calculateTrend(totalMembers, totalMembers * 0.9));
            this.updateTrend('active-members-trend', this.calculateTrend(activeMembers, activeMembers * 0.85));
            this.updateTrend('bec-members-trend', this.calculateTrend(becMembers, becMembers * 0.8));
            this.updateTrend('nec-members-trend', this.calculateTrend(necMembers, necMembers * 0.75));

            // Populate recent users table with exact fields
            this.populateRecentUsersTable(users.slice(-10).reverse());
            
            console.log('✅ Users data processed successfully');
            
        } catch (error) {
            console.error('❌ Error processing users data:', error);
        }
    },

    // Process events data
    processEventsData(events) {
        if (!events || !Array.isArray(events) || events.length === 0) {
            console.warn('No events data available');
            return;
        }

        try {
            const totalEvents = events.length;
            const upcomingEvents = events.filter(event => {
                try {
                    return new Date(event.date) > new Date();
                } catch (error) {
                    return false;
                }
            }).length;
            
            const eventsThisMonth = events.filter(event => {
                try {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                } catch (error) {
                    return false;
                }
            }).length;

            this.updateMetric('total-events', totalEvents);
            this.updateMetric('upcoming-events', upcomingEvents);
            this.updateMetric('active-events', upcomingEvents);
            this.updateMetric('events-this-month', eventsThisMonth);

            this.populateUpcomingEventsTable(events.filter(event => {
                try {
                    return new Date(event.date) > new Date();
                } catch (error) {
                    return false;
                }
            }).slice(0, 10));
            
        } catch (error) {
            console.error('Error processing events data:', error);
        }
    },

    // Process branches data with exact fields
    processBranchesData(branches) {
        if (!branches || !Array.isArray(branches) || branches.length === 0) return;

        try {
            const totalBranches = branches.length;
            const totalMembers = branches.reduce((sum, branch) => sum + (branch.member_count || 0), 0);
            const avgMembersPerBranch = Math.round(totalMembers / Math.max(totalBranches, 1));
            
            const topBranch = branches.reduce((max, branch) => 
                (branch.member_count || 0) > (max.member_count || 0) ? branch : max, branches[0]);

            this.updateMetric('total-branches', totalBranches);
            this.updateMetric('branches-total', totalBranches);
            this.updateMetric('active-branches', totalBranches); // Assuming all are active
            this.updateMetric('avg-members-branch', avgMembersPerBranch);
            this.updateMetric('top-branch-members', topBranch.member_count || 0);

            document.getElementById('top-branch-name').textContent = topBranch.name || 'N/A';

            this.populateBranchRankingTable(branches);
            
        } catch (error) {
            console.error('Error processing branches data:', error);
        }
    },

    // Process alumni data with exact fields from your alumni table
    processAlumniData(alumni) {
        if (!alumni || !Array.isArray(alumni) || alumni.length === 0) {
            console.warn('No alumni data available');
            return;
        }

        try {
            const totalAlumni = alumni.length;
            
            // Alumni who graduated this year
            const alumniThisYear = alumni.filter(alum => {
                try {
                    const gradYear = new Date(alum.graduation_date).getFullYear();
                    return gradYear === new Date().getFullYear();
                } catch (error) {
                    return false;
                }
            }).length;

            // Employment rate from current_status field
            const employedAlumni = alumni.filter(alum => {
                return alum.current_status && alum.current_status.toString().toLowerCase() === 'employed';
            }).length;
            
            const employmentRate = totalAlumni > 0 ? (employedAlumni / totalAlumni) * 100 : 0;

            // Average graduation year
            let avgGraduationYear = 0;
            const validGraduationYears = alumni.filter(alum => alum.graduation_date).map(alum => 
                new Date(alum.graduation_date).getFullYear()
            ).filter(year => !isNaN(year));
            
            if (validGraduationYears.length > 0) {
                avgGraduationYear = Math.round(validGraduationYears.reduce((sum, year) => sum + year, 0) / validGraduationYears.length);
            }

            this.updateMetric('total-alumni', totalAlumni);
            this.updateMetric('alumni-total', totalAlumni);
            this.updateMetric('alumni-this-year', alumniThisYear);
            
            document.getElementById('employment-rate').textContent = employmentRate.toFixed(1) + '%';
            document.getElementById('avg-graduation-year').textContent = avgGraduationYear.toString();

            // Calculate trends
            this.updateTrend('alumni-total-trend', this.calculateTrend(totalAlumni, totalAlumni * 0.8));
            this.updateTrend('alumni-year-trend', this.calculateTrend(alumniThisYear, alumniThisYear * 0.7));
            this.updateTrend('employment-trend', this.calculateTrend(employmentRate, employmentRate * 0.9));
            
        } catch (error) {
            console.error('Error processing alumni data:', error);
        }
    },

    // Process news data with exact fields
    processNewsData(news) {
        if (!news || !Array.isArray(news) || news.length === 0) {
            console.warn('No news data available');
            return;
        }

        try {
            const totalNews = news.length;
            
            // News articles published this month
            const newsThisMonth = news.filter(item => {
                try {
                    const publishDate = new Date(item.publish_date);
                    const now = new Date();
                    return publishDate.getMonth() === now.getMonth() && publishDate.getFullYear() === now.getFullYear();
                } catch (error) {
                    return false;
                }
            }).length;

            // Count unique authors
            const authors = [...new Set(news.map(item => item.author_id))];
            const activeAuthors = authors.length;

            // Average articles per author
            const avgArticlesPerAuthor = activeAuthors > 0 ? (totalNews / activeAuthors) : 0;

            this.updateMetric('total-news', totalNews);
            this.updateMetric('news-this-month', newsThisMonth);
            this.updateMetric('active-authors', activeAuthors);
            document.getElementById('avg-articles-author').textContent = avgArticlesPerAuthor.toFixed(1);

            // Calculate trends
            this.updateTrend('total-news-trend', this.calculateTrend(totalNews, totalNews * 0.8));
            this.updateTrend('news-month-trend', this.calculateTrend(newsThisMonth, newsThisMonth * 0.7));
            this.updateTrend('authors-trend', this.calculateTrend(activeAuthors, activeAuthors * 0.6));
            
        } catch (error) {
            console.error('Error processing news data:', error);
        }
    },

    // Safe metric update function
    updateMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = typeof value === 'number' ? value.toLocaleString() : '0';
        }
    },

    // Sample data generators that match your exact database structure
    generateSampleUsers() {
        return Array.from({length: 47}, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@natesa.org`,
            password: 'hashed_password',
            role: ['member', 'bec', 'admin'][Math.floor(Math.random() * 3)],
            branch_id: Math.floor(Math.random() * 3) + 1,
            is_bec_member: Math.random() > 0.7,
            nec_position: Math.random() > 0.9 ? 'Position ' + i : null,
            bec_position: Math.random() > 0.8 ? 'Position ' + i : null,
            status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)]
        }));
    },

    generateSampleEvents() {
        return Array.from({length: 23}, (_, i) => ({
            id: i + 1,
            title: `Event ${i + 1}`,
            date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            branch_id: Math.floor(Math.random() * 3) + 1,
            created_by: Math.floor(Math.random() * 10) + 1,
            event_type: ['Conference', 'Workshop', 'Meeting'][Math.floor(Math.random() * 3)]
        }));
    },

    generateSampleBranches() {
        return [
            { id: 1, name: 'Main Branch', university: 'National HQ', province: 'Central', member_count: 150, alumni_count: 75 },
            { id: 2, name: 'University A', university: 'University of A', province: 'North', member_count: 85, alumni_count: 40 },
            { id: 3, name: 'University B', university: 'University of B', province: 'South', member_count: 62, alumni_count: 30 }
        ];
    },

    generateSampleNews() {
        return Array.from({length: 15}, (_, i) => ({
            id: i + 1,
            title: `News ${i + 1}`,
            content: `Content for news ${i + 1}`,
            branch_id: Math.floor(Math.random() * 3) + 1,
            author_id: Math.floor(Math.random() * 5) + 1,
            publish_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
    },

    generateSampleAlumni() {
        return Array.from({length: 28}, (_, i) => ({
            id: i + 1,
            user_id: i + 100,
            branch_id: Math.floor(Math.random() * 3) + 1,
            graduation_date: new Date(2015 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12)).toISOString(),
            degree: ['BSc', 'MSc', 'PhD'][Math.floor(Math.random() * 3)],
            current_status: ['employed', 'unemployed', 'graduate school'][Math.floor(Math.random() * 3)]
        }));
    },

    // Helper methods
    calculateTrend(current, previous) {
        return previous === 0 ? 0 : ((current - previous) / previous) * 100;
    },

    updateSystemStatus(startTime, success) {
        const responseTime = Date.now() - startTime;
        document.getElementById('db-status').textContent = success ? 'Connected' : 'Disconnected';
        document.getElementById('db-status').className = `status-value ${success ? 'status-good' : 'status-bad'}`;
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        document.getElementById('api-response').textContent = responseTime + 'ms';
    },

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = show ? 'flex' : 'none';
    },

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
    },

    updateTrend(elementId, change) {
        const element = document.getElementById(elementId);
        if (element) {
            const trendClass = change > 0 ? 'trend-up' : (change < 0 ? 'trend-down' : 'trend-neutral');
            const symbol = change > 0 ? '↗' : (change < 0 ? '↘' : '→');
            element.textContent = `${symbol} ${Math.abs(change).toFixed(1)}%`;
            element.className = 'stat-trend ' + trendClass;
        }
    },

    // Table population with exact field names
    populateRecentUsersTable(users) {
        const tbody = document.getElementById('recent-users-table');
        if (!tbody || !users) return;
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td><span class="role-badge role-${user.role || 'member'}">${user.role || 'member'}</span></td>
                <td>Branch ${user.branch_id}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge status-${user.status || 'active'}">${user.status || 'active'}</span></td>
            </tr>
        `).join('');
    },

    populateUpcomingEventsTable(events) {
        const tbody = document.getElementById('upcoming-events-table');
        if (!tbody || !events) return;
        
        tbody.innerHTML = events.map(event => `
            <tr>
                <td>${event.title || 'N/A'}</td>
                <td>${event.date ? new Date(event.date).toLocaleString() : 'N/A'}</td>
                <td>${event.event_type || 'N/A'}</td>
                <td>Branch ${event.branch_id}</td>
                <td>Location N/A</td>
                <td>User ${event.created_by}</td>
            </tr>
        `).join('');
    },

    populateBranchRankingTable(branches) {
        const tbody = document.getElementById('branch-ranking-table');
        if (!tbody || !branches) return;
        
        tbody.innerHTML = branches.map((branch, index) => `
            <tr>
                <td>#${index + 1}</td>
                <td>${branch.name || 'N/A'}</td>
                <td>${branch.university || 'N/A'}</td>
                <td>${(branch.member_count || 0).toLocaleString()}</td>
                <td>${Math.round((branch.member_count || 0) * 0.7).toLocaleString()}</td>
                <td>${Math.floor(Math.random() * 20) + 5}</td>
                <td>${(branch.alumni_count || 0).toLocaleString()}</td>
                <td>+${Math.round(Math.random() * 20)}%</td>
            </tr>
        `).join('');
    },

    // Export functions
    exportOverviewData() { this.showNotification('Export feature coming soon!', 'info'); },
    exportUserData() { this.showNotification('Export feature coming soon!', 'info'); },
    exportEventData() { this.showNotification('Export feature coming soon!', 'info'); },
    exportBranchData() { this.showNotification('Export feature coming soon!', 'info'); },
    exportAlumniData() { this.showNotification('Export feature coming soon!', 'info'); },
    exportNewsData() { this.showNotification('Export feature coming soon!', 'info'); }
};

// Charts Controller
const charts = {
    chartInstances: {},

    initializeAllCharts() {
        console.log('📈 Initializing charts...');
        this.initializeMemberGrowthChart();
        this.initializeRoleDistributionChart();
        this.initializeStatusPieChart();
        this.initializeMonthlyGrowthChart();
    },

    initializeMemberGrowthChart() {
        try {
            const ctx = document.getElementById('memberGrowthChart');
            if (!ctx) return;
            
            this.chartInstances.memberGrowthChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: { labels: [], datasets: [{
                    label: 'Members', data: [], borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)', fill: true
                }]},
                options: { responsive: true, maintainAspectRatio: false }
            });
        } catch (error) {
            console.error('Error initializing member growth chart:', error);
        }
    },

    initializeRoleDistributionChart() {
        try {
            const ctx = document.getElementById('roleDistributionChart');
            if (!ctx) return;
            
            this.chartInstances.roleDistributionChart = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: { labels: [], datasets: [{
                    data: [], backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12']
                }]},
                options: { responsive: true, maintainAspectRatio: false }
            });
        } catch (error) {
            console.error('Error initializing role distribution chart:', error);
        }
    },

    initializeStatusPieChart() {
        try {
            const ctx = document.getElementById('statusPieChart');
            if (!ctx) return;
            
            this.chartInstances.statusPieChart = new Chart(ctx.getContext('2d'), {
                type: 'pie',
                data: { labels: [], datasets: [{
                    data: [], backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12']
                }]},
                options: { responsive: true, maintainAspectRatio: false }
            });
        } catch (error) {
            console.error('Error initializing status pie chart:', error);
        }
    },

    initializeMonthlyGrowthChart() {
        try {
            const ctx = document.getElementById('monthlyGrowthBarChart');
            if (!ctx) return;
            
            this.chartInstances.monthlyGrowthBarChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: { labels: [], datasets: [{
                    label: 'New Members', data: [], backgroundColor: '#3498db'
                }]},
                options: { responsive: true, maintainAspectRatio: false }
            });
        } catch (error) {
            console.error('Error initializing monthly growth chart:', error);
        }
    },

    updateAllCharts(users, events, branches, alumni, news) {
        console.log('Updating charts with data...');
        this.updateMemberCharts(users);
    },

    updateMemberCharts(users) {
        if (!users) return;

        // Role distribution
        const roles = {};
        users.forEach(user => {
            const role = user.role || 'member';
            roles[role] = (roles[role] || 0) + 1;
        });

        if (this.chartInstances.roleDistributionChart) {
            this.chartInstances.roleDistributionChart.data.labels = Object.keys(roles);
            this.chartInstances.roleDistributionChart.data.datasets[0].data = Object.values(roles);
            this.chartInstances.roleDistributionChart.update();
        }

        // Status distribution
        const statuses = {};
        users.forEach(user => {
            const status = user.status || 'active';
            statuses[status] = (statuses[status] || 0) + 1;
        });

        if (this.chartInstances.statusPieChart) {
            this.chartInstances.statusPieChart.data.labels = Object.keys(statuses);
            this.chartInstances.statusPieChart.data.datasets[0].data = Object.values(statuses);
            this.chartInstances.statusPieChart.update();
        }
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded - starting dashboard...');
    dashboard.initializeDashboard();
});