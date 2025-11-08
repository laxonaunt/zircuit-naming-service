// Zircuit Naming Service - Main Application
class ZircuitNamingService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.domainRegistry = null;
        this.mockZRC = null;
        this.userAddress = null;
        
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        this.bindEvents();
        this.checkPreviousConnection();
    }

    // Bind all event listeners
    bindEvents() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('searchBtn').addEventListener('click', () => this.checkDomainAvailability());
        document.getElementById('registerBtn').addEventListener('click', () => this.registerDomain());
        document.getElementById('domainInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkDomainAvailability();
        });
    }

    // Check if wallet was previously connected
    async checkPreviousConnection() {
        if (window.ethereum && window.ethereum.selectedAddress) {
            await this.initializeWeb3();
        }
    }

    // Connect wallet using WalletConnect
    async connectWallet() {
        try {
            this.showLoading('Connecting wallet...');
            
            if (window.ethereum) {
                // Use MetaMask/Mobile Wallet
                await this.initializeWeb3();
            } else {
                // Use WalletConnect (fallback)
                await this.initializeWalletConnect();
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    // Initialize Web3 with MetaMask
    async initializeWeb3() {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Switch to Zircuit testnet
            await this.switchToZircuitNetwork();
            
            // Create provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            
            // Initialize contracts
            await this.initializeContracts();
            
            // Update UI
            this.updateWalletInfo();
            this.hideLoading();
            
        } catch (error) {
            console.error('Web3 initialization failed:', error);
            throw error;
        }
    }

    // Switch to Zircuit Garfield Testnet
    async switchToZircuitNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.NETWORK.chainId }],
            });
        } catch (switchError) {
            // If network not added, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [CONFIG.NETWORK],
                    });
                } catch (addError) {
                    throw new Error('Failed to add Zircuit network to wallet');
                }
            } else {
                throw switchError;
            }
        }
    }

    // Initialize contract instances
    async initializeContracts() {
        this.domainRegistry = new ethers.Contract(
            CONFIG.CONTRACT_ADDRESSES.domainRegistry,
            CONFIG.DOMAIN_REGISTRY_ABI,
            this.signer
        );

        this.mockZRC = new ethers.Contract(
            CONFIG.CONTRACT_ADDRESSES.mockZRC,
            CONFIG.MOCK_ZRC_ABI,
            this.signer
        );
    }

    // Update wallet information in UI
    async updateWalletInfo() {
        const addressElement = document.getElementById('walletAddress');
        const balanceElement = document.getElementById('tokenBalance');
        const walletInfo = document.getElementById('walletInfo');
        const connectBtn = document.getElementById('connectWallet');

        // Format address for display
        const formattedAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
        addressElement.textContent = formattedAddress;

        // Get token balance
        try {
            const balance = await this.mockZRC.balanceOf(this.userAddress);
            const decimals = await this.mockZRC.decimals();
            const symbol = await this.mockZRC.symbol();
            
            const formattedBalance = ethers.utils.formatUnits(balance, decimals);
            balanceElement.textContent = `${formattedBalance} ${symbol}`;
        } catch (error) {
            console.error('Failed to get balance:', error);
            balanceElement.textContent = 'Balance: N/A';
        }

        // Update UI
        connectBtn.classList.add('hidden');
        walletInfo.classList.remove('hidden');
    }

    // Check domain availability
    async checkDomainAvailability() {
        const domainInput = document.getElementById('domainInput');
        let domainName = domainInput.value.trim();

        if (!domainName) {
            this.showError('Please enter a domain name');
            return;
        }

        // Auto-append .zrc if not present
        if (!domainName.endsWith(CONFIG.SETTINGS.autoAppendTLD)) {
            domainName += CONFIG.SETTINGS.autoAppendTLD;
            domainInput.value = domainName;
        }

        // Validate domain format
        if (!this.isValidDomain(domainName)) {
            this.showError('Invalid domain format. Use only letters, numbers, and hyphens');
            return;
        }

        if (!this.domainRegistry) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            this.showLoading('Checking domain availability...');
            
            // Check if domain is available
            const isAvailable = await this.domainRegistry.isAvailable(domainName);
            
            this.hideLoading();
            this.showAvailabilityResult(domainName, isAvailable);
            
        } catch (error) {
            this.hideLoading();
            console.error('Availability check error:', error);
            this.showError('Failed to check domain availability. Please try again.');
        }
    }

    // Show domain availability result
    showAvailabilityResult(domainName, isAvailable) {
        const resultElement = document.getElementById('availabilityResult');
        const registrationSection = document.getElementById('registrationSection');
        
        resultElement.classList.remove('hidden');
        
        if (isAvailable) {
            resultElement.innerHTML = `✅ "<strong>${domainName}</strong>" is available!`;
            resultElement.className = 'result available';
            registrationSection.classList.remove('hidden');
            
            // Update registration section
            this.updateRegistrationInfo(domainName);
        } else {
            resultElement.innerHTML = `❌ "<strong>${domainName}</strong>" is already registered`;
            resultElement.className = 'result taken';
            registrationSection.classList.add('hidden');
        }
    }

    // Update registration information
    async updateRegistrationInfo(domainName) {
        try {
            const price = await this.domainRegistry.registrationPrice();
            const userBalance = await this.mockZRC.balanceOf(this.userAddress);
            const decimals = await this.mockZRC.decimals();
            
            const formattedPrice = ethers.utils.formatUnits(price, decimals);
            const formattedBalance = ethers.utils.formatUnits(userBalance, decimals);
            
            document.getElementById('registrationPrice').textContent = formattedPrice;
            document.getElementById('userBalance').textContent = formattedBalance;
            
        } catch (error) {
            console.error('Failed to update registration info:', error);
        }
    }

    // Register domain
    async registerDomain() {
        const domainInput = document.getElementById('domainInput');
        const domainName = domainInput.value.trim();

        if (!this.userAddress) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            this.showLoading('Starting domain registration...');
            
            // Get registration price
            const price = await this.domainRegistry.registrationPrice();
            
            // Check and approve tokens
            await this.approveTokens(price);
            
            // Register domain
            this.showLoading('Registering domain...');
            const tx = await this.domainRegistry.registerDomain(domainName);
            
            this.showLoading('Waiting for transaction confirmation...');
            await tx.wait();
            
            this.hideLoading();
            this.showSuccess(`🎉 Domain "${domainName}" registered successfully!`);
            
            // Reset UI
            this.resetRegistrationUI();
            
        } catch (error) {
            this.hideLoading();
            console.error('Registration failed:', error);
            this.showError(`Registration failed: ${error.message}`);
        }
    }

    // Approve tokens for spending
    async approveTokens(amount) {
        try {
            this.showLoading('Approving tokens...');
            
            // Check current allowance
            const currentAllowance = await this.mockZRC.allowance(
                this.userAddress, 
                CONFIG.CONTRACT_ADDRESSES.domainRegistry
            );
            
            if (currentAllowance.lt(amount)) {
                const approveTx = await this.mockZRC.approve(
                    CONFIG.CONTRACT_ADDRESSES.domainRegistry, 
                    amount
                );
                
                this.showLoading('Waiting for approval confirmation...');
                await approveTx.wait();
            }
            
        } catch (error) {
            console.error('Token approval failed:', error);
            throw new Error('Token approval failed: ' + error.message);
        }
    }

    // Reset registration UI
    resetRegistrationUI() {
        document.getElementById('domainInput').value = '';
        document.getElementById('availabilityResult').classList.add('hidden');
        document.getElementById('registrationSection').classList.add('hidden');
    }

    // Domain validation
    isValidDomain(domain) {
        const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.zrc$/;
        return domainRegex.test(domain.toLowerCase());
    }

    // UI Helper Methods
    showLoading(message = 'Processing...') {
        const loading = document.getElementById('loading');
        loading.querySelector('p').textContent = message;
        loading.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showSuccess(message) {
        this.showStatus(message, 'success');
    }

    showError(message) {
        this.showStatus(message, 'error');
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('transactionStatus');
        statusElement.textContent = message;
        statusElement.className = `transaction-status ${type}`;
        statusElement.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 5000);
    }
}

// WalletConnect initialization (fallback)
ZircuitNamingService.prototype.initializeWalletConnect = async function() {
    // This would be implemented for full WalletConnect support
    throw new Error('Please install MetaMask or a Web3-enabled browser');
};

// Initialize  app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.znsApp = new ZircuitNamingService();
});