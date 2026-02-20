import { useSocketContext } from '../context/SocketContext';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import '../styles/connection-status.css';

function ConnectionStatus() {
    const { isConnected } = useSocketContext();
    
    return (
        <div className={`connection-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (
                <>
                    <Wifi size={14} />
                    <span>Connected</span>
                </>
            ) : (
                <>
                    <Loader size={14} className="spinner" />
                    <span>Connecting...</span>
                </>
            )}
        </div>
    );
}

export default ConnectionStatus;
