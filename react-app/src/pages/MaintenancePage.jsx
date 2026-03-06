import { useAppSettings } from '../context/AppSettingsContext';
import { Wrench, RefreshCw } from 'lucide-react';
import './MaintenancePage.css';

const MaintenancePage = () => {
    const { site_name, maintenance_message } = useAppSettings();

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="maintenance-page">
            <div className="maintenance-bg">
                <div className="maintenance-grid"></div>
            </div>

            <div className="maintenance-content">
                <div className="maintenance-icon">
                    <Wrench size={48} />
                </div>

                <h1 className="maintenance-title">Under Maintenance</h1>
                <p className="maintenance-subtitle">
                    {maintenance_message || `${site_name} is currently undergoing scheduled maintenance.`}
                </p>
                <p className="maintenance-info">
                    We're working hard to improve your experience. Please check back soon!
                </p>

                <button className="maintenance-btn" onClick={handleRefresh}>
                    <RefreshCw size={18} />
                    Refresh Page
                </button>

                <div className="maintenance-status">
                    <span className="status-dot"></span>
                    Maintenance in progress
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
