import React, { useState } from 'react';
import ReactJoyride from 'react-joyride';

const OnboardingSteps = () => {
  const [joyride, setJoyride] = useState({
    run: true,
    steps: [
      {
        title: "Welcome to SimpleID!",
        target: "body",
        placement: "center",
        content: <div><h4>Communicate with your users</h4><p>This walkthrough will show you all the features that are available in this application.</p></div>,
        disableBeacon: true,
      },
      {
        title: "Dashboard",
        target: ".Dashboard",
        placement: "right",
        placementBeacon: "right",
        content: "You can see the various users segments here",
      },
      {
        title: "Pending and finished jobs",
        target: ".Jobs",
        placement: "right",
        placementBeacon: "right",
        content: "You can view the import and segmentation jobs here",
      },
      {
        title: "Segments",
        target: ".Segments",
        placement: "right",
        placementBeacon: "right",
        content: "You can view segments here",
      },
      {
        title: "Notifications",
        target: ".Notifications",
        placement: "right",
        placementBeacon: "right",
        content: "You can create and activate your in-app notifications here",
      },
      {
        title: "Email",
        target: ".Email",
        placement: "right",
        placementBeacon: "right",
        content: "You can create and activate your emails here",
      },
      {
        title: "Projects",
        target: ".Projects",
        placement: "right",
        placementBeacon: "right",
        content: "You can view your various projects here",
      },
      {
        title: "Accounts",
        target: ".Accounts",
        placement: "right",
        placementBeacon: "right",
        content: "You can view your account details here",
      },
    ]
  });

  return (
    <React.Fragment>
      <ReactJoyride
        className="custom-modal"
        steps={joyride.steps}
        run={joyride.run}
        continuous
        showProgress
        showSkipButton />
    </React.Fragment>
  );
};

export default OnboardingSteps
