import { NavLink, useOutlet } from "react-router-dom";

import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import RateReviewIcon from "@mui/icons-material/RateReview";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import { useAuth } from "../AuthProvider";
import { StyledEngineProvider } from "@mui/material/styles";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupIcon from "@mui/icons-material/Group";

// Layout for sidebar menu for all pages
const MainLayout = () => {
  const outlet = useOutlet();
  const { user, logout, auth } = useAuth();
  return (
    <StyledEngineProvider injectFirst>
      <Grid container spacing={1}>
        <Grid item xs={2}>
          <Paper elevation={3} className="side-menu">
            <MenuList>
              {/* If user authenticated show whole menu */}
              {user && user.email ? (
                <>
                  <NavLink to="/">
                    <MenuItem>
                      <ListItemIcon>
                        <HomeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Create Snippet</ListItemText>
                    </MenuItem>
                  </NavLink>

                  <NavLink to="/weekly-report">
                    <MenuItem>
                      <ListItemIcon>
                        <HomeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Weekly Report</ListItemText>
                    </MenuItem>
                  </NavLink>

                  <NavLink to="/my-snippets">
                    <MenuItem>
                      <ListItemIcon>
                        <HomeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>My Snippets</ListItemText>
                    </MenuItem>
                  </NavLink>

                  <NavLink to="/snippets">
                    <MenuItem>
                      <ListItemIcon>
                        <GroupIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>All Snippets</ListItemText>
                    </MenuItem>
                  </NavLink>

                  <NavLink to="/users">
                    <MenuItem>
                      <ListItemIcon>
                        <GroupIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Users</ListItemText>
                    </MenuItem>
                  </NavLink>

              

                  <MenuItem onClick={logout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </>
              ) : (
                <NavLink to="/login">
                  {/* If user not authenticated, give button to authenticate */}
                  <MenuItem>
                    <ListItemIcon>
                      <LoginIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Login</ListItemText>
                  </MenuItem>
                </NavLink>
              )}
            </MenuList>
          </Paper>
        </Grid>
        {/* Main page section */}
        <Grid item xs={9.5} className="main-page">
          {outlet}
        </Grid>
      </Grid>
    </StyledEngineProvider>
  );
};

export default MainLayout;
