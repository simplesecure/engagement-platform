import React from 'react';
import { setGlobal } from 'reactn';
import ReactJoyride, { STATUS } from 'react-joyride';

const OnboardingSteps = () => {
  const joyride = {
    run: true,
    steps: [
      {
        title: "Welcome to SimpleID!",
        target: "body",
        placement: "center",
        content: <div><h4>Communicate with your users</h4><p>Let's learn how to use SimpleID to better understand and engage with people.</p></div>,
        disableBeacon: true,
      },
      {
        title: "Dashboard",
        target: ".Dashboard",
        placement: "right",
        placementBeacon: "right",
        content: "Your dashboard is a customizable landing page for high level data.",
      },
      {
        title: "Pending and finished jobs",
        target: ".Jobs",
        placement: "right",
        placementBeacon: "right",
        content: "The job queue is where you can check on the status of long-running processes like creating segments and importing wallet.",
      },
      {
        title: "Segments",
        target: ".Segments",
        placement: "right",
        placementBeacon: "right",
        content: "Get a granular view of your users by segmenting them into logical groups based on blockchain data.",
      },
      {
        title: "Notifications",
        target: ".Notifications",
        placement: "right",
        placementBeacon: "right",
        content: "Create in-app notifications that are designed specifically for people in specified segments. No more blast notifications to everyone.",
      },
      {
        title: "Email",
        target: ".Email",
        placement: "right",
        placementBeacon: "right",
        content: "Email people without violating their privacy through a cryptographic isolation process that ensures a wallet address can't ever be linked back to an email.",
      },
      {
        title: "Projects",
        target: ".Projects",
        placement: "right",
        placementBeacon: "right",
        content: "Get the appId for use in our SDK and API or create new projects here.",
      },
      {
        title: "Accounts",
        target: ".Accounts",
        placement: "right",
        placementBeacon: "right",
        content: "See your account status, billing information, team information, and more.",
      },
    ]
  };

  const handleJoyrideCallback = data => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('onboarding-complete', 'true');
      setGlobal({ onboardingComplete: true });
    }
  };

  return (
    <React.Fragment>
      <ReactJoyride
        className="custom-modal"
        steps={joyride.steps}
        run={joyride.run}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton />
    </React.Fragment>
  );
};

export default OnboardingSteps
