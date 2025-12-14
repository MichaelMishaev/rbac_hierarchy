import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    // Only SuperAdmin can export organizational tree
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Fetch complete organizational tree data (same as /api/org-tree)
    const areaManagers = await prisma.areaManager.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        cities: {
          where: {
            isActive: true,
          },
          include: {
            coordinators: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
            activistCoordinators: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
            neighborhoods: {
              where: {
                isActive: true,
              },
              include: {
                activists: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        regionName: 'asc',
      },
    });

    // Transform to tree structure
    const treeData = {
      name: 'Super Admin',
      type: 'superadmin',
      attributes: {
        role: 'מנהל מערכת',
      },
      children: areaManagers.map((areaManager) => ({
        name: areaManager.regionName,
        type: 'area',
        attributes: {
          type: 'מחוז',
          count: {
            cities: areaManager.cities.length,
            neighborhoods: areaManager.cities.reduce((sum, c) => sum + c.neighborhoods.length, 0),
            activists: areaManager.cities.reduce(
              (sum, c) => sum + c.neighborhoods.reduce((s, n) => s + n.activists.length, 0),
              0
            ),
          },
        },
        children: [
          {
            name: areaManager.user?.fullName || 'N/A',
            type: 'areamanager',
            attributes: {
              email: areaManager.user?.email || 'N/A',
              role: 'מנהל אזור',
            },
            children: (areaManager.cities || []).map((city: any) => ({
              name: city.name,
              type: 'city',
              attributes: {
                code: city.code,
                neighborhoods: city.neighborhoods?.length || 0,
                activists: city.neighborhoods?.reduce((sum: number, n: any) => sum + (n.activists?.length || 0), 0) || 0,
              },
              children: [
                // City Coordinators Group
                ...(city.coordinators && city.coordinators.length > 0
                  ? [
                      {
                        name: `רכזי עיר (${city.coordinators.length})`,
                        type: 'coordinators-group',
                        children: city.coordinators.map((coord: any) => ({
                          name: coord.user?.fullName || 'N/A',
                          type: 'coordinator',
                          attributes: {
                            role: 'רכז עיר',
                          },
                        })),
                      },
                    ]
                  : []),
                // Activist Coordinators Group
                ...(city.activistCoordinators && city.activistCoordinators.length > 0
                  ? [
                      {
                        name: `רכזי פעילים (${city.activistCoordinators.length})`,
                        type: 'activist-coordinators-group',
                        children: city.activistCoordinators.map((coord: any) => ({
                          name: coord.user?.fullName || 'N/A',
                          type: 'activistCoordinator',
                          attributes: {
                            role: 'רכז פעילים',
                          },
                        })),
                      },
                    ]
                  : []),
                // Neighborhoods
                ...(city.neighborhoods || []).map((neighborhood: any) => ({
                  name: neighborhood.name,
                  type: 'neighborhood',
                  attributes: {
                    activists: neighborhood.activists?.length || 0,
                  },
                  children: (neighborhood.activists || []).map((activist: any) => ({
                    name: activist.fullName,
                    type: 'activist',
                    attributes: {
                      phone: activist.phone,
                      role: 'פעיל',
                    },
                  })),
                })),
              ],
            })),
          },
        ],
      })),
    };

    // Generate standalone HTML with embedded data
    const html = generateStandaloneHTML(treeData);

    // Return HTML file for download
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="org-tree-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating HTML export:', error);
    return NextResponse.json({ error: 'Failed to generate HTML export' }, { status: 500 });
  }
}

function generateStandaloneHTML(treeData: any): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>עץ ארגוני - מערכת בחירות</title>
    <script src="https://unpkg.com/d3@7"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Segoe UI Hebrew', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            direction: rtl;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 1.8rem;
            margin-bottom: 5px;
        }

        .controls {
            padding: 15px 20px;
            background: white;
            border-bottom: 1px solid #e1e8ed;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
        }

        button {
            padding: 10px 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        button:hover {
            background: #f0f0f0;
            border-color: #667eea;
        }

        button.primary {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        button.primary:hover {
            background: #5568d3;
        }

        #tree-container {
            width: 100%;
            height: calc(100vh - 140px);
            background: #ffffff;
            overflow: hidden;
            position: relative;
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .node rect {
            cursor: pointer;
            transition: all 0.3s;
            rx: 8px;
        }

        .node:hover rect {
            filter: brightness(1.1);
            stroke-width: 3px;
        }

        .node text {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Segoe UI Hebrew', Arial, sans-serif;
            pointer-events: none;
            fill: white;
            font-weight: 600;
            text-anchor: middle;
            dominant-baseline: middle;
        }

        .link {
            fill: none;
            stroke: #4B5563;
            stroke-width: 4px;
            opacity: 0.9;
            transition: all 0.3s ease;
            marker-end: url(#arrowhead);
        }

        .link:hover {
            stroke: #1F2937;
            stroke-width: 5px;
            opacity: 1;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        /* Modern card-based design - 2025 UX Best Practices */
        .node-superadmin rect {
            fill: #7C3AED;
            stroke: #6D28D9;
            stroke-width: 2px;
            filter: drop-shadow(0 4px 12px rgba(124, 58, 237, 0.3));
        }
        .node-superadmin text {
            fill: white;
            font-size: 18px;
            font-weight: 700;
        }

        .node-area rect {
            fill: #6366F1;
            stroke: #4F46E5;
            stroke-width: 2px;
            filter: drop-shadow(0 4px 10px rgba(99, 102, 241, 0.3));
        }
        .node-area text {
            fill: white;
            font-size: 16px;
            font-weight: 700;
        }

        .node-areamanager rect {
            fill: #2563EB;
            stroke: #1D4ED8;
            stroke-width: 2px;
            filter: drop-shadow(0 3px 8px rgba(37, 99, 235, 0.3));
        }
        .node-areamanager text {
            fill: white;
            font-size: 15px;
            font-weight: 600;
        }

        .node-city rect {
            fill: #0EA5E9;
            stroke: #0284C7;
            stroke-width: 2px;
            filter: drop-shadow(0 3px 8px rgba(14, 165, 233, 0.3));
        }
        .node-city text {
            fill: white;
            font-size: 15px;
            font-weight: 600;
        }

        .node-coordinators-group rect {
            fill: #059669;
            stroke: #047857;
            stroke-width: 2px;
            filter: drop-shadow(0 2px 6px rgba(5, 150, 105, 0.25));
        }
        .node-coordinators-group text {
            fill: white;
            font-size: 13px;
            font-weight: 600;
        }

        .node-activist-coordinators-group rect {
            fill: #F59E0B;
            stroke: #D97706;
            stroke-width: 2px;
            filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.25));
        }
        .node-activist-coordinators-group text {
            fill: white;
            font-size: 13px;
            font-weight: 600;
        }

        .node-coordinator rect {
            fill: #10B981;
            stroke: #059669;
            stroke-width: 2px;
            filter: drop-shadow(0 2px 6px rgba(16, 185, 129, 0.25));
        }
        .node-coordinator text {
            fill: white;
            font-size: 14px;
            font-weight: 500;
        }

        .node-activistCoordinator rect {
            fill: #F97316;
            stroke: #EA580C;
            stroke-width: 2px;
            filter: drop-shadow(0 2px 6px rgba(249, 115, 22, 0.25));
        }
        .node-activistCoordinator text {
            fill: white;
            font-size: 14px;
            font-weight: 500;
        }

        .node-neighborhood rect {
            fill: #EC4899;
            stroke: #DB2777;
            stroke-width: 2px;
            filter: drop-shadow(0 2px 6px rgba(236, 72, 153, 0.25));
        }
        .node-neighborhood text {
            fill: white;
            font-size: 14px;
            font-weight: 500;
        }

        .node-activist rect {
            fill: #8B5CF6;
            stroke: #7C3AED;
            stroke-width: 1.5px;
            filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.2));
        }
        .node-activist text {
            fill: white;
            font-size: 13px;
            font-weight: 500;
        }

        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌳 עץ ארגוני - מערכת ניהול קמפיין בחירות</h1>
        <p>תצוגה אינטראקטיבית של כל ההיררכיה הארגונית</p>
    </div>

    <div class="controls">
        <button onclick="zoomIn()">
            <span>🔍</span> הגדל
        </button>
        <button onclick="zoomOut()">
            <span>🔍</span> הקטן
        </button>
        <button onclick="resetView()" class="primary">
            <span>↺</span> איפוס תצוגה
        </button>
        <button onclick="expandAll()">
            <span>📂</span> הרחב הכל
        </button>
        <button onclick="collapseAll()">
            <span>📁</span> כווץ הכל
        </button>
    </div>

    <div id="tree-container"></div>
    <div class="tooltip" id="tooltip"></div>

    <script>
        // Tree data embedded
        const treeData = ${JSON.stringify(treeData, null, 2)};

        // D3 Tree Setup
        const margin = { top: 20, right: 120, bottom: 20, left: 120 };
        const width = window.innerWidth - margin.right - margin.left;
        const height = window.innerHeight - 140 - margin.top - margin.bottom;

        const svg = d3.select("#tree-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(d3.zoom()
                .scaleExtent([0.1, 3])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                })
            )
            .append("g")
            .attr("id", "main-g");

        // Add arrow marker definition for connection lines
        svg.append("defs")
            .append("marker")
            .attr("id", "arrowhead")
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("refX", 8)
            .attr("refY", 3)
            .attr("orient", "auto")
            .attr("markerUnits", "strokeWidth")
            .append("path")
            .attr("d", "M0,0 L0,6 L9,3 z")
            .attr("fill", "#4B5563");

        const g = svg.append("g")
            .attr("transform", \`translate(\${width / 2},\${margin.top})\`);

        const tree = d3.tree().nodeSize([250, 100]);

        let root = d3.hierarchy(treeData);
        root.x0 = 0;
        root.y0 = 0;

        // Node ID counter (MUST be declared before use)
        let i = 0;

        // Collapse all nodes initially except root
        root.children.forEach(collapse);

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        function expand(d) {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            if (d.children) {
                d.children.forEach(expand);
            }
        }

        update(root);

        function update(source) {
            const treeData = tree(root);
            const nodes = treeData.descendants();
            const links = treeData.links();

            nodes.forEach(d => { d.y = d.depth * 120; });

            const node = g.selectAll('g.node')
                .data(nodes, d => d.id || (d.id = ++i));

            const nodeEnter = node.enter().append('g')
                .attr('class', d => \`node node-\${d.data.type}\`)
                .attr("transform", d => \`translate(\${source.x0},\${source.y0})\`)
                .on('click', click);

            // Get node size based on type (2025 UX: Visual hierarchy through size)
            const getNodeSize = (type) => {
                switch(type) {
                    case 'superadmin': return { width: 140, height: 50 };
                    case 'area': return { width: 130, height: 45 };
                    case 'areamanager': return { width: 120, height: 40 };
                    case 'city': return { width: 120, height: 40 };
                    case 'coordinators-group':
                    case 'activist-coordinators-group': return { width: 110, height: 35 };
                    case 'coordinator':
                    case 'activistCoordinator': return { width: 110, height: 35 };
                    case 'neighborhood': return { width: 100, height: 35 };
                    case 'activist': return { width: 95, height: 32 };
                    default: return { width: 100, height: 35 };
                }
            };

            nodeEnter.append('rect')
                .attr('width', d => getNodeSize(d.data.type).width)
                .attr('height', d => getNodeSize(d.data.type).height)
                .attr('x', d => -getNodeSize(d.data.type).width / 2)
                .attr('y', d => -getNodeSize(d.data.type).height / 2);

            nodeEnter.append('text')
                .attr("dy", "0.35em")
                .text(d => {
                    const maxLength = 18;
                    return d.data.name.length > maxLength ?
                        d.data.name.substring(0, maxLength) + '...' :
                        d.data.name;
                })
                .style("fill-opacity", 0);

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition()
                .duration(500)
                .attr("transform", d => \`translate(\${d.x},\${d.y})\`);

            nodeUpdate.select('text')
                .style("fill-opacity", 1);

            const nodeExit = node.exit().transition()
                .duration(500)
                .attr("transform", d => \`translate(\${source.x},\${source.y})\`)
                .remove();

            nodeExit.select('rect')
                .attr('width', 0)
                .attr('height', 0);

            nodeExit.select('text')
                .style('fill-opacity', 0);

            const link = g.selectAll('path.link')
                .data(links, d => d.target.id);

            const linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal(o, o);
                });

            const linkUpdate = linkEnter.merge(link);

            linkUpdate.transition()
                .duration(500)
                .attr('d', d => diagonal(d.source, d.target));

            link.exit().transition()
                .duration(500)
                .attr('d', d => {
                    const o = { x: source.x, y: source.y };
                    return diagonal(o, o);
                })
                .remove();

            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        function diagonal(s, d) {
            return \`M \${s.x} \${s.y}
                    C \${s.x} \${(s.y + d.y) / 2},
                      \${d.x} \${(s.y + d.y) / 2},
                      \${d.x} \${d.y}\`;
        }

        function click(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }

        function zoomIn() {
            svg.transition().call(d3.zoom().scaleBy, 1.3);
        }

        function zoomOut() {
            svg.transition().call(d3.zoom().scaleBy, 0.7);
        }

        function resetView() {
            svg.transition().call(
                d3.zoom().transform,
                d3.zoomIdentity.translate(width / 2, margin.top).scale(1)
            );
        }

        function expandAll() {
            expand(root);
            update(root);
        }

        function collapseAll() {
            root.children.forEach(collapse);
            update(root);
        }
    </script>
</body>
</html>`;
}
