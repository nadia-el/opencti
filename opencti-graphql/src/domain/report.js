import { map, assoc } from 'ramda';
import uuid from 'uuid/v4';
import {
  deleteByID,
  loadByID,
  notify,
  now,
  paginate,
  paginateRelationships,
  prepareDate,
  yearFormat,
  monthFormat,
  takeTx,
  prepareString
} from '../database/grakn';
import { BUS_TOPICS } from '../config/conf';

export const findAll = args => {
  if (args.orderBy === 'createdByRef') {
    const finalArgs = assoc('orderBy', 'name', args);
    return paginate(
      `match $r isa Report; ${
        args.reportClass
          ? `$m has report_class "${prepareString(args.reportClass)}"`
          : ''
      } $rel(creator:$x, so:$r) isa created_by_ref`,
      finalArgs,
      true,
      'x'
    );
  }
  return paginate(
    `match $r isa Report ${
      args.reportClass
        ? `; $r has report_class "${prepareString(args.reportClass)}"`
        : ''
    }`,
    args
  );
};

export const findByEntity = args => {
  if (args.orderBy === 'createdByRef') {
    const finalArgs = assoc('orderBy', 'name', args);
    return paginate(
      `match $r isa Report; ${
        args.reportClass
          ? `$r has report_class "${prepareString(args.reportClass)}"`
          : ''
      } $rel(knowledge_aggregation:$r, so:$so) isa object_refs; 
        $so id ${args.objectId};
        $relCreatedByRef(creator:$x, so:$r) isa created_by_ref`,
      finalArgs,
      true,
      'x'
    );
  }
  return paginate(
    `match $r isa Report; 
    $rel(knowledge_aggregation:$r, so:$so) isa object_refs; 
    $so id ${args.objectId} ${
      args.reportClass
        ? `; $r has report_class "${prepareString(args.reportClass)}"`
        : ''
    }`,
    args
  );
};

export const findById = reportId => loadByID(reportId);

export const objectRefs = (reportId, args) =>
  paginate(
    `match $so isa Stix-Domain-Entity; 
    $rel(so:$so, knowledge_aggregation:$report) isa object_refs; 
    $report id ${reportId}`,
    args
  );

export const relationRefs = (reportId, args) =>
  paginateRelationships(
    `match $rel($from, $to) isa stix_relation; 
    $extraRel(so:$rel, knowledge_aggregation:$report) isa object_refs; 
    $report id ${reportId}`,
    args,
    'extraRel'
  );

export const addReport = async (user, report) => {
  const wTx = await takeTx();
  const reportIterator = await wTx.query(`insert $report isa Report 
    has type "report";
    $report has stix_id "report--${uuid()}";
    $report has stix_label "";
    $report has stix_label_lowercase "";
    $report has alias "";
    $report has alias_lowercase "";
    $report has name "${prepareString(report.name)}";
    $report has description "${prepareString(report.description)}";
    $report has name_lowercase "${prepareString(report.name.toLowerCase())}";
    $report has description_lowercase "${
      report.description ? prepareString(report.description.toLowerCase()) : ''
    }";
    $report has published ${prepareDate(report.published)};
    $report has published_month "${monthFormat(report.published)}";
    $report has published_year "${yearFormat(report.published)}";
    $report has report_class "${prepareString(report.report_class)}";
    $report has graph_data "";
    $report has created ${now()};
    $report has modified ${now()};
    $report has revoked false;
    $report has created_at ${now()};
    $report has created_at_month "${monthFormat(now())}";
    $report has created_at_year "${yearFormat(now())}";        
    $report has updated_at ${now()};
  `);
  const createdReport = await reportIterator.next();
  const createdReportId = await createdReport.map().get('report').id;

  if (report.createdByRef) {
    await wTx.query(`match $from id ${createdReportId};
         $to id ${report.createdByRef};
         insert (so: $from, creator: $to)
         isa created_by_ref;`);
  }

  if (report.markingDefinitions) {
    const createMarkingDefinition = markingDefinition =>
      wTx.query(
        `match $from id ${createdReportId}; $to id ${markingDefinition}; insert (so: $from, marking: $to) isa object_marking_refs;`
      );
    const markingDefinitionsPromises = map(
      createMarkingDefinition,
      report.markingDefinitions
    );
    await Promise.all(markingDefinitionsPromises);
  }

  await wTx.commit();

  return loadByID(createdReportId).then(created =>
    notify(BUS_TOPICS.StixDomainEntity.ADDED_TOPIC, created, user)
  );
};

export const reportDelete = reportId => deleteByID(reportId);
