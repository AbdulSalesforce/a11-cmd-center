import { useEffect } from 'react';
import SupportSchedule from '../components/SupportSchedule';
import CalendarEvents from '../components/CalendarEvents';

export default function Home() {
  useEffect(() => {
    document.title = 'Accessibility Command Center';
  }, []);

  return (
    <div className="slds-scope">
      <div className="slds-container_large slds-container_center slds-p-around_large">
        {/* Hero Section */}
        <div className="slds-text-align_center slds-m-bottom_xx-large">
          <h1 className="slds-text-heading_large slds-m-bottom_medium">
            Accessibility Command Center
          </h1>
        </div>

        {/* Support Schedule */}
        <div className="slds-m-bottom_x-large">
          <SupportSchedule />
        </div>

        {/* Calendar Events */}
        <div className="slds-m-bottom_x-large">
          <CalendarEvents />
        </div>
      </div>
    </div>
  );
}
