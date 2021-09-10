import React, { useEffect, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { Classes as Popover2Classes } from "@blueprintjs/popover2";
import {
  ApplicationPayload,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  getApplicationViewerPageURL,
} from "constants/routes";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import PagePlugLogo from "assets/images/pageplug_icon_mint.svg";
import { Link } from "react-router-dom";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPageSaving,
  getIsPublishingApplication,
  getPageSavingError,
} from "selectors/editorSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { connect, useDispatch, useSelector } from "react-redux";
import { HeaderIcons } from "icons/HeaderIcons";
import ThreeDotLoading from "components/designSystems/appsmith/header/ThreeDotsLoading";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import { EditInteractionKind, SavingState } from "components/ads/EditableText";
import { updateApplication } from "actions/applicationActions";
import {
  getApplicationList,
  getIsSavingAppName,
  getIsErroredSavingAppName,
  showAppInviteUsersDialogSelector,
} from "selectors/applicationSelectors";
import EditorAppName from "./EditorAppName";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import OnboardingHelper from "components/editorComponents/Onboarding/Helper";
import { OnboardingStep } from "constants/OnboardingConstants";
import GlobalSearch from "components/editorComponents/GlobalSearch";
import EndOnboardingTour from "components/editorComponents/Onboarding/EndTour";
import ProfileDropdown from "pages/common/ProfileDropdown";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import Button, { Size } from "components/ads/Button";
import { IconWrapper } from "components/ads/Icon";
import { Profile } from "pages/common/ProfileImage";
import { getTypographyByKey } from "constants/DefaultTheme";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import HelpButton from "./HelpButton";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import ToggleModeButton from "pages/Editor/ToggleModeButton";
import TooltipComponent from "components/ads/Tooltip";
import moment from "moment/moment";
import { Colors } from "constants/Colors";
import { snipingModeSelector } from "selectors/editorSelectors";
import { setSnipingMode as setSnipingModeAction } from "actions/propertyPaneActions";
import { useLocation } from "react-router";

const HeaderWrapper = styled(StyledHeader)`
  width: 100%;
  padding-right: 0;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  background-color: ${(props) => props.theme.colors.header.background};
  height: ${(props) => props.theme.smallHeaderHeight};
  flex-direction: row;
  box-shadow: ${(props) => props.theme.colors.header.boxShadow};
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
  & .editable-application-name {
    ${(props) => getTypographyByKey(props, "h4")}
    color: ${(props) => props.theme.colors.header.appName};
  }

  & .header__application-share-btn {
    background-color: ${(props) => props.theme.colors.header.background};
    border-color: ${(props) => props.theme.colors.header.background};
    color: ${(props) => props.theme.colors.header.shareBtn};
    ${IconWrapper} path {
      fill: ${(props) => props.theme.colors.header.shareBtn};
    }
  }

  & .header__application-share-btn:hover {
    color: ${(props) => props.theme.colors.header.shareBtnHighlight};
    ${IconWrapper} path {
      fill: ${(props) => props.theme.colors.header.shareBtnHighlight};
    }
  }

  & ${Profile} {
    width: 24px;
    height: 24px;
  }

  & .t--save-status-container .header-status-icon {
    vertical-align: -6px;
  }
`;

const HeaderSection = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  overflow: visible;
  align-items: center;
  :nth-child(1) {
    justify-content: flex-start;
    max-width: 30%;
  }
  :nth-child(2) {
    justify-content: center;
  }
  :nth-child(3) {
    justify-content: flex-end;
  }
  > .${Popover2Classes.POPOVER2_TARGET} {
    max-width: calc(100% - 50px);
    min-width: 100px;
  }
`;

const PagePlugLogoImg = styled.img`
  margin-right: ${(props) => props.theme.spaces[6]}px;
  height: 28px;
`;

const SaveStatusContainer = styled.div`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const DeploySection = styled.div`
  display: flex;
`;

const ProfileDropdownContainer = styled.div`
  margin: 0 ${(props) => props.theme.spaces[7]}px;
`;

const StyledDeployButton = styled(Button)`
  height: ${(props) => props.theme.smallHeaderHeight};
  ${(props) => getTypographyByKey(props, "btnLarge")}
  padding: ${(props) => props.theme.spaces[2]}px;
  border-radius: 0;
`;

const BindingBanner = styled.div`
  position: fixed;
  width: 199px;
  height: 36px;
  left: 50%;
  top: ${(props) => props.theme.smallHeaderHeight};
  transform: translate(-50%, 0);
  text-align: center;
  background: ${Colors.DANUBE};

  color: ${Colors.WHITE};
  font-weight: 500;
  font-size: 15px;
  line-height: 20px;
  /* Depth: 01 */
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 9999;
`;

const CloudOSHeader = styled.div`
  position: fixed;
  right: 20px;
  top: 8px;
  display: flex;
  align-items: center;

  & .bp3-popover-wrapper {
    height: 20px;
  }

  & .t--application-publish-btn {
    height: 25px;
    width: 60px;
    border-radius: 3px;
    margin-left: 16px;
  }
`;

type EditorHeaderProps = {
  pageSaveError?: boolean;
  pageName?: string;
  pageId?: string;
  isPublishing: boolean;
  publishedTime?: string;
  orgId: string;
  applicationId?: string;
  currentApplication?: ApplicationPayload;
  isSaving: boolean;
  publishApplication: (appId: string) => void;
  lightTheme: any;
  lastUpdatedTime?: number;
  inCloudOS: any;
};

export function EditorHeader(props: EditorHeaderProps) {
  const {
    applicationId,
    currentApplication,
    isPublishing,
    isSaving,
    lastUpdatedTime,
    orgId,
    pageId,
    pageSaveError,
    publishApplication,
    inCloudOS,
  } = props;
  const location = useLocation();
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isSavingName = useSelector(getIsSavingAppName);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const user = useSelector(getCurrentUser);
  const [lastUpdatedTimeMessage, setLastUpdatedTimeMessage] = useState<string>(
    "",
  );

  useEffect(() => {
    if (window.location.href) {
      const searchParams = new URL(window.location.href).searchParams;
      const isSnipingMode = searchParams.get("isSnipingMode");
      const updatedIsSnipingMode = isSnipingMode === "true";
      dispatch(setSnipingModeAction(updatedIsSnipingMode));
    }
  }, [location]);

  const findLastUpdatedTimeMessage = () => {
    setLastUpdatedTimeMessage(
      lastUpdatedTime
        ? `上次保存于 ${moment(lastUpdatedTime * 1000).fromNow()}`
        : "",
    );
  };

  useEffect(() => {
    findLastUpdatedTimeMessage();
    const interval = setInterval(
      findLastUpdatedTimeMessage,
      (moment.relativeTimeThreshold("ss") as number) * 1000,
    );
    return () => {
      clearInterval(interval);
    };
  }, [lastUpdatedTime]);

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const handlePublish = () => {
    if (applicationId) {
      publishApplication(applicationId);

      const appName = currentApplication ? currentApplication.name : "";
      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: applicationId,
        appName,
      });
    }
  };

  let saveStatusIcon: React.ReactNode;
  if (isSaving) {
    saveStatusIcon = <ThreeDotLoading className="t--save-status-is-saving" />;
  } else {
    if (!pageSaveError) {
      saveStatusIcon = (
        <TooltipComponent content={lastUpdatedTimeMessage} hoverOpenDelay={200}>
          <HeaderIcons.SAVE_SUCCESS
            className="t--save-status-success header-status-icon"
            color={"#36AB80"}
            height={20}
            width={20}
          />
        </TooltipComponent>
      );
    } else {
      saveStatusIcon = (
        <HeaderIcons.SAVE_FAILURE
          className={"t--save-status-error header-status-icon"}
          color={"#F69D2C"}
          height={20}
          width={20}
        />
      );
    }
  }

  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };

  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );

  if (inCloudOS) {
    return (
      <ThemeProvider theme={props.lightTheme}>
        <CloudOSHeader>
          {saveStatusIcon}
          <span style={{ color: "#8a8a8a" }}>{lastUpdatedTimeMessage}</span>
          <StyledDeployButton
            className="t--application-publish-btn"
            isLoading={isPublishing}
            onClick={handlePublish}
            size={Size.small}
            text={"提交"}
          />
        </CloudOSHeader>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={props.lightTheme}>
      <HeaderWrapper>
        <HeaderSection>
          <Link style={{ height: 28 }} to={APPLICATIONS_URL}>
            <PagePlugLogoImg
              alt="PagePlug logo"
              className="t--appsmith-logo"
              src={PagePlugLogo}
            />
          </Link>
          <Boxed step={OnboardingStep.FINISH}>
            <EditorAppName
              applicationId={applicationId}
              className="t--application-name editable-application-name"
              currentDeployLink={getApplicationViewerPageURL(
                applicationId,
                pageId,
              )}
              defaultSavingState={
                isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
              }
              defaultValue={currentApplication?.name || ""}
              deploy={handlePublish}
              editInteractionKind={EditInteractionKind.SINGLE}
              fill
              isError={isErroredSavingName}
              isNewApp={
                applicationList.filter((el) => el.id === applicationId).length >
                0
              }
              isPopoverOpen={isPopoverOpen}
              onBlur={(value: string) =>
                updateApplicationDispatch(applicationId || "", {
                  name: value,
                  currentApp: true,
                })
              }
              setIsPopoverOpen={setIsPopoverOpen}
            />
            <ToggleModeButton showSelectedMode={!isPopoverOpen} />
          </Boxed>
        </HeaderSection>
        <HeaderSection>{/* <HelpBar /><HelpButton /> */}</HeaderSection>
        <HeaderSection>
          <Boxed step={OnboardingStep.FINISH}>
            <SaveStatusContainer className={"t--save-status-container"}>
              {saveStatusIcon}
            </SaveStatusContainer>
            <FormDialogComponent
              Form={AppInviteUsersForm}
              applicationId={applicationId}
              canOutsideClickClose
              isOpen={showAppInviteUsersDialog}
              orgId={orgId}
              title={currentApplication ? currentApplication.name : "分享应用"}
              trigger={
                <Button
                  className="t--application-share-btn header__application-share-btn"
                  icon={"share"}
                  size={Size.small}
                  text={"分享"}
                />
              }
            />
          </Boxed>
          <Boxed
            alternative={<EndOnboardingTour />}
            step={OnboardingStep.DEPLOY}
          >
            <DeploySection>
              <OnboardingIndicator
                hasButton={false}
                step={OnboardingStep.DEPLOY}
                width={75}
              >
                <StyledDeployButton
                  className="t--application-publish-btn"
                  isLoading={isPublishing}
                  onClick={handlePublish}
                  size={Size.small}
                  text={"发布应用"}
                />
              </OnboardingIndicator>

              <DeployLinkButtonDialog
                link={getApplicationViewerPageURL(applicationId, pageId)}
                trigger={
                  <StyledDeployButton icon={"downArrow"} size={Size.xxs} />
                }
              />
            </DeploySection>
          </Boxed>
          {user && user.username !== ANONYMOUS_USERNAME && (
            <ProfileDropdownContainer>
              <ProfileDropdown
                hideThemeSwitch
                name={user.name}
                userName={user?.username || ""}
              />
            </ProfileDropdownContainer>
          )}
        </HeaderSection>
        <OnboardingHelper />
        <GlobalSearch />
        {isSnipingMode && (
          <BindingBanner className="t--sniping-mode-banner">
            选择一个组件绑定
          </BindingBanner>
        )}
      </HeaderWrapper>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState) => ({
  lastUpdatedTime: state.ui.editor.lastUpdatedTime,
  pageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  pageSaveError: getPageSavingError(state),
  orgId: getCurrentOrgId(state),
  applicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  pageId: getCurrentPageId(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
  inCloudOS: state.entities.app.inCloudOS,
});

const mapDispatchToProps = (dispatch: any) => ({
  publishApplication: (applicationId: string) => {
    dispatch({
      type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
      payload: {
        applicationId,
      },
    });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EditorHeader);
