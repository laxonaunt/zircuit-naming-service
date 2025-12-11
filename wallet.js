// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const walletConnected = document.getElementById('walletConnected');
const walletAddress = document.getElementById('walletAddress');
const ethBalance = document.getElementById('ethBalance');
const zrcBalance = document.getElementById('zrcBalance');
const disconnectBtn = document.getElementById('disconnectBtn');

// Update wallet info
async function updateBalances() {
    if (!currentAccount) return;
    
    try {
        // Get ETH balance
        const ethBalanceWei = await provider.getBalance(currentAccount);
        const ethBalanceFormatted = ethers.formatEther(ethBalanceWei);
        ethBalance.textContent = parseFloat(ethBalanceFormatted).toFixed(4);
        
        // Get mZRC balance
        const zrcBalanceWei = await mockZRCContract.balanceOf(currentAccount);
        const zrcBalanceFormatted = ethers.formatEther(zrcBalanceWei);
        zrcBalance.textContent = parseFloat(zrcBalanceFormatted).toFixed(2);
        
        // Format address
        const shortAddress = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        walletAddress.textContent = shortAddress;
        walletAddress.title = currentAccount;
        
    } catch (error) {
        console.error('Error updating balances:', error);
    }
}

// Connect wallet
async function connectWallet() {
    try {
        if (!window.ethereum) {
            showError('Please install MetaMask to use ZNS');
            return;
        }
        
        // Request accounts
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length === 0) {
            showError('No accounts found. Please unlock MetaMask.');
            return;
        }
        
        // Initialize provider
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(48898)) {
            const switched = await switchToZircuit();
            if (!switched) return;
        }
        
        // Get signer
        signer = await provider.getSigner();
        currentAccount = await signer.getAddress();
        
        // Initialize contracts
        domainRegistryContract = new ethers.Contract(
            CONTRACT_ADDRESSES.domainRegistry,
            DomainRegistryABI,
            signer
        );
        
        mockZRCContract = new ethers.Contract(
            CONTRACT_ADDRESSES.mockZRCToken,
            MockZRCABI,
            signer
        );
        
        // Update UI
        connectBtn.style.display = 'none';
        walletConnected.style.display = 'flex';
        await updateBalances();
        
        console.log('Wallet connected:', currentAccount);
        
    } catch (error) {
        console.error('Connection error:', error);
        
        if (error.code === 4001) {
            showError('Connection rejected by user');
        } else {
            showError('Failed to connect wallet');
        }
    }
}

// Disconnect wallet
function disconnectWallet() {
    currentAccount = null;
    provider = null;
    signer = null;
    domainRegistryContract = null;
    mockZRCContract = null;
    
    // Reset UI
    connectBtn.style.display = 'block';
    walletConnected.style.display = 'none';
    
    // Hide search results
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
    
    // Clear search
    const domainSearch = document.getElementById('domainSearch');
    if (domainSearch) {
        domainSearch.value = '';
    }
    
    console.log('Wallet disconnected');
}

// Switch to Zircuit network
async function switchToZircuit() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ZIRCUIT_CONFIG]
        });
        return true;
    } catch (error) {
        console.error('Network switch error:', error);
        
        // Try switch if already added
        if (error.code === 4001) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ZIRCUIT_CONFIG.chainId }]
                });
                return true;
            } catch (switchError) {
                showError('Failed to switch to Zircuit Testnet');
                return false;
            }
        }
        
        showError('Failed to add Zircuit Testnet');
        return false;
    }
}

// Event Listeners
connectBtn.addEventListener('click', connectWallet);
disconnectBtn.addEventListener('click', disconnectWallet);

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            // Auto-reconnect
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } else {
            disconnectWallet();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// Auto-connect on load
window.addEventListener('load', async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
                // Auto-initialize
                provider = new ethers.BrowserProvider(window.ethereum);
                
                // Check network
                const network = await provider.getNetwork();
                if (network.chainId === BigInt(48898)) {
                    signer = await provider.getSigner();
                    currentAccount = await signer.getAddress();
                    
                    // Initialize contracts
                    domainRegistryContract = new ethers.Contract(
                        CONTRACT_ADDRESSES.domainRegistry,
                        DomainRegistryABI,
                        signer
                    );
                    
                    mockZRCContract = new ethers.Contract(
                        CONTRACT_ADDRESSES.mockZRCToken,
                        MockZRCABI,
                        signer
                    );
                    
                    // Update UI
                    connectBtn.style.display = 'none';
                    walletConnected.style.display = 'flex';
                    await updateBalances();
                }
            }
        } catch (error) {
            console.error('Auto-connect failed:', error);
        }
    }
})

// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Close menu on link click
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
}
;
