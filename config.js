// Zircuit Naming Service Configuration
const CONFIG = {
    // Zircuit Garfield Testnet Network
    NETWORK: {
        chainId: "0xBF02", // 48898 in hexadecimal
        chainName: "Zircuit Garfield Testnet",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18
        },
        rpcUrls: ["https://garfield-testnet.zircuit.com"],
        blockExplorerUrls: ["https://explorer.garfield-testnet.zircuit.com/"]
    },

    // Contract Addresses
    CONTRACT_ADDRESSES: {
        domainRegistry: "0x90a08B05C4A2d41176aF09D87e545F8707fc3F9F",
        mockZRC: "0x3a7BabED31AA299a7B5A4964DAEdd4Bf1552Bf1a"
    },

    // Contract ABIs 
    DOMAIN_REGISTRY_ABI: [
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "domain",
                    "type": "string"
                }
            ],
            "name": "isAvailable",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "domain",
                    "type": "string"
                }
            ],
            "name": "registerDomain",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "registrationPrice",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "name": "domainOwners",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ],

    MOCK_ZRC_ABI: [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "internalType": "uint8",
                    "name": "",
                    "type": "uint8"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ],

    // App Settings
    SETTINGS: {// Zircuit Garfield Testnet Configuration
const ZIRCUIT_CONFIG = {
    chainId: "0xBF22", // 48898 in hex
    chainName: "Zircuit Garfield Testnet",
    nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
    },
    rpcUrls: ["https://garfield-testnet.zircuit.com"],
    blockExplorerUrls: ["https://explorer.garfield-testnet.zircuit.com"]
};

// Contract Addresses
const CONTRACT_ADDRESSES = {
    domainRegistry: "0x8795527c9ED6A4803e0F7d3552973E8C45dee38D",
    mockZRCToken: "0x3a7BabED31AA299a7B5A4964DAEdd4Bf1552Bf1a"
};

// Minimal ABIs (only functions we need)
const DomainRegistryABI = [
    // View functions
    "function resolveDomain(string) view returns (address)",
    "function isAvailable(string) view returns (bool)",
    "function domainOwners(string) view returns (address)",
    "function domainExpiry(string) view returns (uint256)",
    "function registrationPrice() view returns (uint256)",
    
    // Write functions  
    "function registerDomain(string)",
    "function renewDomain(string)",
    "function transferDomain(string, address)",
    
    // Events
    "event DomainRegistered(string domain, address owner, uint256 expiry)",
    "event DomainRenewed(string domain, uint256 newExpiry)",
    "event DomainTransferred(string domain, address newOwner)"
];

const MockZRCABI = [
    // Standard ERC20 functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

// Global variables
let provider;
let signer;
let domainRegistryContract;
let mockZRCContract;
let currentAccount = null;
        autoAppendTLD: ".zrc",
        defaultRegistrationPeriod: 365 * 24 * 60 * 60 // 1 year in seconds
    }

};
