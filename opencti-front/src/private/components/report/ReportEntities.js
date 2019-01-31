/* eslint-disable no-nested-ternary */
// TODO Remove no-nested-ternary
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  compose, map, sortWith, ascend, descend, prop,
} from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { createFragmentContainer } from 'react-relay';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { ArrowDropDown, ArrowDropUp, KeyboardArrowRight } from '@material-ui/icons';
import { resolveLink } from '../../../utils/Entity';
import inject18n from '../../../components/i18n';
import ItemIcon from '../../../components/ItemIcon';
import ReportAddObjectRefs from './ReportAddObjectRefs';

const styles = theme => ({
  linesContainer: {
    paddingTop: 0,
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    transition: 'background-color 0.1s ease',
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  goIcon: {
    position: 'absolute',
    right: 10,
    marginRight: 0,
  },
  inputLabel: {
    float: 'left',
  },
  sortIcon: {
    float: 'left',
    margin: '-5px 0 0 15px',
  },
});

const inlineStylesHeaders = {
  iconSort: {
    position: 'absolute',
    margin: '-3px 0 0 5px',
    padding: 0,
    top: '0px',
  },
  name: {
    float: 'left',
    width: '40%',
    fontSize: 12,
    fontWeight: '700',
  },
  type: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  created_at: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  updated_at: {
    float: 'left',
    fontSize: 12,
    fontWeight: '700',
  },
};

const inlineStyles = {
  name: {
    float: 'left',
    width: '40%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  type: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  created_at: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  updated_at: {
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

class ReportEntitiesCompnent extends Component {
  constructor(props) {
    super(props);
    this.state = { sortBy: 'name', orderAsc: false };
  }

  reverseBy(field) {
    this.setState({ sortBy: field, orderAsc: !this.state.orderAsc });
  }

  SortHeader(field, label, isSortable) {
    const { t } = this.props;
    if (isSortable) {
      return (
        <div style={inlineStylesHeaders[field]} onClick={this.reverseBy.bind(this, field)}>
          <span>{t(label)}</span>
          {this.state.sortBy === field ? this.state.orderAsc ? <ArrowDropDown style={inlineStylesHeaders.iconSort}/> : <ArrowDropUp style={inlineStylesHeaders.iconSort}/> : ''}
        </div>
      );
    }
    return (
      <div style={inlineStylesHeaders[field]}>
        <span>{t(label)}</span>
      </div>
    );
  }

  render() {
    const {
      t, fd, classes, report,
    } = this.props;
    const objectRefs = map(n => n.node, report.objectRefs.edges);
    const sort = sortWith(this.state.orderAsc ? [ascend(prop(this.state.sortBy))] : [descend(prop(this.state.sortBy))]);
    const sortedObjectRefs = sort(objectRefs);
    return (
      <div>
        <List classes={{ root: classes.linesContainer }}>
          <ListItem classes={{ root: classes.itemHead }} divider={false} style={{ paddingTop: 0 }}>
            <ListItemIcon>
              <span style={{ padding: '0 8px 0 8px', fontWeight: 700, fontSize: 12 }}>#</span>
            </ListItemIcon>
            <ListItemText primary={
              <div>
                {this.SortHeader('name', 'Name', true)}
                {this.SortHeader('type', 'Entity type', true)}
                {this.SortHeader('created_at', 'Creation date', true)}
                {this.SortHeader('updated_at', 'Modification date', true)}
              </div>
            }/>
          </ListItem>
          {sortedObjectRefs.map((objectRef) => {
            const link = resolveLink(objectRef.type);
            return (
              <ListItem key={objectRef.id} classes={{ root: classes.item }} divider={true} component={Link} to={`${link}/${objectRef.id}`}>
                <ListItemIcon classes={{ root: classes.itemIcon }}>
                  <ItemIcon type={objectRef.type}/>
                </ListItemIcon>
                <ListItemText primary={
                  <div>
                    <div className={classes.bodyItem} style={inlineStyles.name}>
                      {objectRef.name}
                    </div>
                    <div className={classes.bodyItem} style={inlineStyles.type}>
                      {t(`entity_${objectRef.type}`)}
                    </div>
                    <div className={classes.bodyItem} style={inlineStyles.created_at}>
                      {fd(objectRef.created_at)}
                    </div>
                    <div className={classes.bodyItem} style={inlineStyles.updated_at}>
                      {fd(objectRef.updated_at)}
                    </div>
                  </div>
                }/>
                <ListItemIcon classes={{ root: classes.goIcon }}>
                  <KeyboardArrowRight/>
                </ListItemIcon>
              </ListItem>
            );
          })}
        </List>
        <ReportAddObjectRefs
          reportId={report.id}
          reportObjectRefs={report.objectRefs.edges}
        />
      </div>
    );
  }
}

ReportEntitiesCompnent.propTypes = {
  report: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  fd: PropTypes.func,
  history: PropTypes.object,
};

const ReportEntities = createFragmentContainer(ReportEntitiesCompnent, {
  report: graphql`
      fragment ReportEntities_report on Report {
          id
          objectRefs {
              edges {
                  node {
                      id
                      type
                      name
                      created_at
                      updated_at
                  }
              }
          }
      }
  `,
});

export default compose(
  inject18n,
  withStyles(styles),
)(ReportEntities);
