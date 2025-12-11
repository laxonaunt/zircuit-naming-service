// DOM Elements
const domainSearch = document.getElementById('domainSearch');
const searchAction = document.getElementById('searchAction');
const searchResults = document.getElementById('searchResults');
const resultName = document.getElementById('resultName');
const resultStatus = document.getElementById('resultStatus');
const resultInfo = document.getElementById('resultInfo');
const resultActions = document.getElementById('resultActions');
const transactionModal = document.getElementById('transactionModal');
const modalMessage = document.getElementById('modalMessage');
const modalLink = document.getElementById('modalLink');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Utility Functions
function formatAddress(address) {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
        return 'No owner';
    }
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

function formatTimestamp(timestamp) {
    if (!timestamp || timestamp === 0) return 'Never';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function daysUntilExpiry(timestamp) {
    if (!timestamp || timestamp === 0) return 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(timestamp) - now;
    return Math.max(0, Math.floor(diff / 86400));
}

// Show modal
function showModal(message, txHash = null) {
    modalMessage.textContent = message;
    if (txHash) {
        modalLink.href = `${ZIRCUIT_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
        modalLink.style.display = 'inline-flex';
    } else {
        modalLink.style.display = 'none';
    }
    transactionModal.style.display = 'flex';
}

function hideModal() {
    transactionModal.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function hideError() {
    errorModal.style.display = 'none';
}

// Check domain availability
async function checkDomain(name) {
    try {
        const domain = name.toLowerCase().trim();
        if (!domain.endsWith('.zrc')) {
            throw new Error('Domain must end with .zrc');
        }
        
        const isAvailable = await domainRegistryContract.isAvailable(domain);
        let owner = '0x0000000000000000000000000000000000000000';
        let expiry = 0;
        
        if (!isAvailable) {
            owner = await domainRegistryContract.domainOwners(domain);
            expiry = await domainRegistryContract.domainExpiry(domain);
        }
        
        return { isAvailable, owner, expiry, domain };
    } catch (error) {
        console.error('Error checking domain:', error);
        throw error;
    }
}

// Display search results
function displayResults(data) {
    const daysLeft = daysUntilExpiry(data.expiry);
    const isExpired = daysLeft === 0 && data.owner !== '0x0000000000000000000000000000000000000000';
    const isOwner = data.owner.toLowerCase() === currentAccount?.toLowerCase();
    
    // Update name
    const nameWithoutSuffix = data.domain.replace('.zrc', '');
    resultName.textContent = nameWithoutSuffix;
    
    // Update status
    if (data.isAvailable || isExpired) {
        resultStatus.textContent = 'AVAILABLE';
        resultStatus.className = 'status-badge status-available';
    } else if (isOwner) {
        resultStatus.textContent = 'YOUR DOMAIN';
        resultStatus.className = 'status-badge status-registered';
    } else {
        resultStatus.textContent = 'REGISTERED';
        resultStatus.className = 'status-badge status-registered';
    }
    
    // Update info
    let infoHTML = '';
    if (data.isAvailable || isExpired) {
        infoHTML = `
            <p>This name is available for registration!</p>
            <div class="price-tag">
                <i class="fas fa-tag"></i>
                <strong>Price:</strong> 1 mZRC per year
            </div>
        `;
    } else if (isOwner) {
        infoHTML = `
            <p><strong>Owner:</strong> You (${formatAddress(data.owner)})</p>
            <p><strong>Expires:</strong> ${formatTimestamp(data.expiry)}</p>
            <p><strong>Time remaining:</strong> ${daysLeft} days</p>
        `;
    } else {
        infoHTML = `
            <p><strong>Owner:</strong> ${formatAddress(data.owner)}</p>
            <p><strong>Expires:</strong> ${formatTimestamp(data.expiry)}</p>
            <p><strong>Time remaining:</strong> ${daysLeft} days</p>
        `;
    }
    resultInfo.innerHTML = infoHTML;
    
    // Update actions
    let actionsHTML = '';
    if (data.isAvailable || isExpired) {
        actionsHTML = `
            <button class="btn-primary" onclick="registerDomain('${data.domain}')">
                <i class="fas fa-shopping-cart"></i> Register Now
            </button>
        `;
    } else if (isOwner) {
        actionsHTML = `
            <button class="btn-primary" onclick="renewDomain('${data.domain}')">
                <i class="fas fa-redo"></i> Renew Domain
            </button>
            <button class="btn-secondary" onclick="transferDomain('${data.domain}')">
                <i class="fas fa-exchange-alt"></i> Transfer
            </button>
        `;
    } else {
        actionsHTML = `
            <button class="btn-secondary" onclick="sendToDomain('${data.domain}')">
                <i class="fas fa-paper-plane"></i> Send to ${nameWithoutSuffix}.zrc
            </button>
        `;
    }
    resultActions.innerHTML = actionsHTML;
    
    // Show results
    searchResults.style.display = 'block';
}

// Register domain
async function registerDomain(domain) {
    try {
        if (!currentAccount) {
            showError('Please connect your wallet first');
            return;
        }
        
        // Re-check availability
        const domainData = await checkDomain(domain);
        if (!domainData.isAvailable && daysUntilExpiry(domainData.expiry) > 0) {
            showError('Domain is no longer available');
            return;
        }
        
        showModal('Preparing registration...');
        
        // Check balance
        const price = await domainRegistryContract.registrationPrice();
        const balance = await mockZRCContract.balanceOf(currentAccount);
        
        if (balance < price) {
            hideModal();
            showError('Insufficient mZRC balance. You need 1 mZRC to register.');
            return;
        }
        
        // Check and approve allowance
        const allowance = await mockZRCContract.allowance(
            currentAccount,
            CONTRACT_ADDRESSES.domainRegistry
        );
        
        if (allowance < price) {
            modalMessage.textContent = 'Approving mZRC spending...';
            const approveTx = await mockZRCContract.approve(
                CONTRACT_ADDRESSES.domainRegistry,
                price,
                { gasLimit: 100000 }
            );
            
            modalMessage.textContent = 'Waiting for approval...';
            modalLink.href = `${ZIRCUIT_CONFIG.blockExplorerUrls[0]}/tx/${approveTx.hash}`;
            
            await approveTx.wait(1);
        }
        
        // Register domain
        modalMessage.textContent = 'Registering domain...';
        const registerTx = await domainRegistryContract.registerDomain(domain, {
            gasLimit: 300000
        });
        
        modalMessage.textContent = 'Waiting for confirmation...';
        modalLink.href = `${ZIRCUIT_CONFIG.blockExplorerUrls[0]}/tx/${registerTx.hash}`;
        
        const receipt = await registerTx.wait();
        
        if (receipt.status === 1) {
            modalMessage.textContent = 'Domain registered successfully!';
            
            // Update balances
            await updateBalances();
            
            // Refresh results
            setTimeout(async () => {
                const newData = await checkDomain(domain);
                displayResults(newData);
                setTimeout(hideModal, 2000);
            }, 2000);
        } else {
            throw new Error('Transaction failed');
        }
        
    } catch (error) {
        hideModal();
        console.error('Registration error:', error);
        
        if (error.code === 4001) {
            showError('Transaction was cancelled');
        } else if (error.message.includes('Domain taken')) {
            showError('Domain was taken while you were registering');
        } else {
            showError(`Registration failed: ${error.message}`);
        }
    }
}

// Renew domain
async function renewDomain(domain) {
    try {
        showModal('Preparing renewal...');
        
        const price = await domainRegistryContract.registrationPrice();
        const balance = await mockZRCContract.balanceOf(currentAccount);
        
        if (balance < price) {
            hideModal();
            showError('Insufficient mZRC balance. You need 1 mZRC to renew.');
            return;
        }
        
        // Check allowance
        const allowance = await mockZRCContract.allowance(
            currentAccount,
            CONTRACT_ADDRESSES.domainRegistry
        );
        
        if (allowance < price) {
            modalMessage.textContent = 'Approving mZRC spending...';
            const approveTx = await mockZRCContract.approve(
                CONTRACT_ADDRESSES.domainRegistry,
                price,
                { gasLimit: 100000 }
            );
            
            modalMessage.textContent = 'Waiting for approval...';
            modalLink.href = `${ZIRCUIT_CONFIG.blockExplorerUrls[0]}/tx/${approveTx.hash}`;
            
            await approveTx.wait(1);
        }
        
        // Renew domain
        modalMessage.textContent = 'Renewing domain...';
        const renewTx = await domainRegistryContract.renewDomain(domain, {
            gasLimit: 300000
        });
        
        modalMessage.textContent = 'Waiting for confirmation...';
        modalLink.href = `${ZIRCUIT_CONFIG.blockExplorerUrls[0]}/tx/${renewTx.hash}`;
        
        const receipt = await renewTx.wait();
        
        if (receipt.status === 1) {
            modalMessage.textContent = 'Domain renewed successfully!';
            
            await updateBalances();
            
            setTimeout(async () => {
                const newData = await checkDomain(domain);
                displayResults(newData);
                setTimeout(hideModal, 2000);
            }, 2000);
        } else {
            throw new Error('Transaction failed');
        }
        
    } catch (error) {
        hideModal();
        console.error('Renewal error:', error);
        
        if (error.code === 4001) {
            showError('Transaction was cancelled');
        } else {
            showError(`Renewal failed: ${error.message}`);
        }
    }
}

// Transfer domain
async function transferDomain(domain) {
    const newOwner = prompt('Enter the new owner\'s address:');
    
    if (!newOwner) return;
    
    if (!ethers.isAddress(newOwner)) {
        showError('Invalid Ethereum address');
        return;
    }
    
    if (!confirm(`Transfer ${domain} to ${newOwner}?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        showModal('Transferring domain...');
        
        const transferTx = await domainRegistryContract.transferDomain(domain, newOwner, {
            gasLimit: 200000
        });
        
        modalMessage.textContent = 'Waiting for confirmation...';
        modalLink.href = `${ZIRCUIT_CONFIG.blockExplorerUrls[0]}/tx/${transferTx.hash}`;
        
        const receipt = await transferTx.wait();
        
        if (receipt.status === 1) {
            modalMessage.textContent = 'Domain transferred successfully!';
            
            setTimeout(async () => {
                const newData = await checkDomain(domain);
                displayResults(newData);
                setTimeout(hideModal, 2000);
            }, 2000);
        } else {
            throw new Error('Transaction failed');
        }
        
    } catch (error) {
        hideModal();
        console.error('Transfer error:', error);
        
        if (error.code === 4001) {
            showError('Transaction was cancelled');
        } else {
            showError(`Transfer failed: ${error.message}`);
        }
    }
}

// Redirect to send page
function sendToDomain(domain) {
    window.location.href = `send.html?to=${encodeURIComponent(domain)}`;
}

// Search function
async function performSearch() {
    const name = domainSearch.value.trim();
    
    if (!name) {
        showError('Please enter a name to search');
        return;
    }
    
    if (!currentAccount) {
        showError('Please connect your wallet first');
        return;
    }
    
    try {
        searchAction.disabled = true;
        searchAction.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const fullDomain = name.toLowerCase().endsWith('.zrc') ? name.toLowerCase() : `${name.toLowerCase()}.zrc`;
        const domainData = await checkDomain(fullDomain);
        displayResults(domainData);
        
    } catch (error) {
        console.error('Search error:', error);
        showError(error.message || 'Failed to search domain');
        searchResults.style.display = 'none';
    } finally {
        searchAction.disabled = false;
        searchAction.innerHTML = '<i class="fas fa-search"></i>';
    }
}

// Event Listeners
searchAction.addEventListener('click', performSearch);

domainSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Auto-focus search on load
window.addEventListener('load', () => {
    domainSearch.focus();
});
